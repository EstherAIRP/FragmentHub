"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import type { Fragment } from "@/lib/fragment-schema";
import { movableStatuses } from "@/lib/fragments/board";
import type { ManualFragmentDraft } from "@/lib/fragments/manual-draft";
import { statusLabels } from "@/lib/fragments/presentation";

type Status = Fragment["status"];

type StatusMoveMenuProps = {
  id: string;
  title: string;
  status: Status;
  updatedAt: string;
  /** Stored Fragment as a draft; null when a status-only move is unsafe. */
  draft: ManualFragmentDraft | null;
  /** When set, the menu is rendered disabled with this explanation. */
  disabledReason?: string;
};

const conflictMessage = "這筆已在別處更新，請重新整理後再試";

export function StatusMoveMenu({
  id,
  title,
  status,
  updatedAt,
  draft,
  disabledReason,
}: StatusMoveMenuProps) {
  const router = useRouter();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Status | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = Boolean(disabledReason) || !draft;
  const options = movableStatuses.filter((value) => value !== status);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [open]);

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(next: Status) {
    setOpen(false);
    setTarget(next);
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (pending) return;
    dialogRef.current?.close();
  }

  async function confirmMove() {
    if (!draft || !target || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/fragments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft: { ...draft, status: target },
          expected_updated_at: updatedAt,
        }),
      });

      if (response.status === 409) {
        setError(conflictMessage);
        router.refresh();
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "移動失敗，請稍後再試。");
        return;
      }

      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("移動失敗，請檢查網路連線後再試。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="moveMenu"
      ref={wrapperRef}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          closeMenu(true);
        }
      }}
    >
      <button
        ref={triggerRef}
        className="moveTrigger"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`移動「${title}」的狀態`}
        disabled={disabled || pending}
        title={disabledReason}
        onClick={() => setOpen((value) => !value)}
      >
        {pending ? "移動中…" : "移到 ▸"}
      </button>

      {open ? (
        <ul className="moveOptions" id={menuId}>
          {options.map((value) => (
            <li key={value}>
              <button type="button" onClick={() => choose(value)}>
                {statusLabels[value]}
              </button>
            </li>
          ))}
          {status !== "archived" ? (
            <li className="moveOptionArchive">
              <button type="button" onClick={() => choose("archived")}>
                封存
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        className="moveDialog"
        aria-labelledby={`${menuId}-title`}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClose={() => {
          setTarget(null);
          setError(null);
          triggerRef.current?.focus();
        }}
      >
        <p className="moveDialogTitle" id={`${menuId}-title`}>
          把「{title}」從 {statusLabels[status]} 移到{" "}
          {target ? statusLabels[target] : ""}？
        </p>

        {error ? (
          <p className="moveDialogError" role="alert">
            {error}
          </p>
        ) : null}

        <div className="moveDialogActions">
          <button
            className="secondaryButton"
            type="button"
            onClick={closeDialog}
            disabled={pending}
          >
            取消
          </button>
          <button
            className="primaryButton"
            type="button"
            onClick={confirmMove}
            disabled={pending || error === conflictMessage}
          >
            {pending ? "移動中…" : "確認"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
