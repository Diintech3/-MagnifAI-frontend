import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import {
  LuBold, LuItalic, LuUnderline, LuStrikethrough,
  LuList, LuListOrdered, LuQuote, LuLink, LuImage,
  LuAlignLeft, LuAlignCenter, LuAlignRight, LuAlignJustify,
  LuUndo2, LuRedo2, LuCode, LuMinus,
  LuPencil, LuEye,
} from "react-icons/lu";

// ── Markdown → HTML (basic) ─────────────────────────────────

export function markdownToHtml(text) {
  if (!text) return "";
  const str = typeof text === "string" ? text : text.join("\n");
  if (/<[a-z][\s\S]*>/i.test(str)) return str;

  return str
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return "";
      if (block.startsWith("### ")) return `<h3>${inline(block.slice(4))}</h3>`;
      if (block.startsWith("## "))  return `<h2>${inline(block.slice(3))}</h2>`;
      if (block.startsWith("# "))   return `<h1>${inline(block.slice(2))}</h1>`;
      if (block.startsWith("> "))   return `<blockquote><p>${inline(block.slice(2))}</p></blockquote>`;
      if (block.startsWith("- ") || block.startsWith("* ")) {
        const items = block.split("\n").map(l => `<li>${inline(l.replace(/^[-*]\s/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/.test(block)) {
        const items = block.split("\n").map(l => `<li>${inline(l.replace(/^\d+\.\s/, ""))}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      if (block === "---" || block === "***") return "<hr/>";
      return `<p>${block.split("\n").map(inline).join("<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  function inline(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  }
}

// ── Toolbar button ───────────────────────────────────────────

function ToolBtn({ icon: Icon, title, active, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick?.(); }}
      className={`rounded p-1.5 transition ${active ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"} disabled:opacity-40`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-slate-200 shrink-0" />;
}

// ── Rich Text Editor ─────────────────────────────────────────

export const RichTextEditor = forwardRef(function RichTextEditor({ value, onChange, placeholder = "Compose your post…", contentKey, onInsertImage }, ref) {
  const editorRef = useRef(null);
  const [viewMode, setViewMode] = useState("compose");
  const [htmlSource, setHtmlSource] = useState("");
  const lastKey = useRef(null);

  useImperativeHandle(ref, () => ({
    insertImageUrl(displayUrl, serverUrl) {
      const src = serverUrl || displayUrl;
      const img = `<img src="${displayUrl}" data-src="${src}" alt="image" style="max-width:100%;width:auto;height:auto;max-height:400px;border-radius:8px;margin:8px 0;display:block;object-fit:contain;" />`;
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, img);
      if (editorRef.current) onChange?.(editorRef.current.innerHTML);
    },
  }));

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncContent();
  }, [syncContent]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (lastKey.current === contentKey) return;
    // Always decode HTML entities before setting content
    const decoded = (value || "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const html = /<[a-z][\s\S]*>/i.test(decoded) ? decoded : markdownToHtml(decoded);
    editorRef.current.innerHTML = html || "";
    setHtmlSource(html);
    lastKey.current = contentKey;
  }, [contentKey, value]);

  function insertLink() {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  }

  function insertImage() {
    if (onInsertImage) {
      onInsertImage();
    } else {
      const url = prompt("Enter image URL:");
      if (url) exec("insertImage", url);
    }
  }

  function insertImageUrl(url) {
    exec("insertImage", url);
  }

  function insertHr() {
    exec("insertHorizontalRule");
  }

  function setHeading(tag) {
    exec("formatBlock", tag);
  }

  function handleHtmlChange(e) {
    const html = e.target.value;
    setHtmlSource(html);
    onChange?.(html);
    if (editorRef.current) editorRef.current.innerHTML = html;
  }

  function switchToHtml() {
    const html = editorRef.current?.innerHTML || "";
    setHtmlSource(html);
    setViewMode("html");
  }

  function switchToCompose() {
    if (editorRef.current) editorRef.current.innerHTML = htmlSource;
    setViewMode("compose");
    syncContent();
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-white flex-wrap shrink-0">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden mr-1">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setViewMode("compose"); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition ${viewMode === "compose" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <LuPencil className="h-3.5 w-3.5" /> Compose
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); switchToHtml(); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition ${viewMode === "html" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <LuCode className="h-3.5 w-3.5" /> HTML
          </button>
        </div>

        <Divider />

        {viewMode === "compose" && (
          <>
            <ToolBtn icon={LuUndo2} title="Undo" onClick={() => exec("undo")} />
            <ToolBtn icon={LuRedo2} title="Redo" onClick={() => exec("redo")} />
            <Divider />

            <select
              onChange={e => setHeading(e.target.value)}
              defaultValue=""
              className="h-8 rounded border border-slate-200 px-2 text-xs text-slate-700 bg-white outline-none cursor-pointer"
              onMouseDown={e => e.stopPropagation()}
            >
              <option value="" disabled>Format</option>
              <option value="p">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote</option>
            </select>

            <Divider />

            <ToolBtn icon={LuBold}          title="Bold"          onClick={() => exec("bold")} />
            <ToolBtn icon={LuItalic}        title="Italic"        onClick={() => exec("italic")} />
            <ToolBtn icon={LuUnderline}     title="Underline"     onClick={() => exec("underline")} />
            <ToolBtn icon={LuStrikethrough} title="Strikethrough" onClick={() => exec("strikeThrough")} />
            <Divider />

            <ToolBtn icon={LuAlignLeft}    title="Align Left"   onClick={() => exec("justifyLeft")} />
            <ToolBtn icon={LuAlignCenter}  title="Align Center" onClick={() => exec("justifyCenter")} />
            <ToolBtn icon={LuAlignRight}   title="Align Right"  onClick={() => exec("justifyRight")} />
            <ToolBtn icon={LuAlignJustify} title="Justify"      onClick={() => exec("justifyFull")} />
            <Divider />

            <ToolBtn icon={LuList}        title="Bullet List"   onClick={() => exec("insertUnorderedList")} />
            <ToolBtn icon={LuListOrdered} title="Numbered List" onClick={() => exec("insertOrderedList")} />
            <ToolBtn icon={LuQuote}       title="Blockquote"    onClick={() => exec("formatBlock", "blockquote")} />
            <Divider />

            <ToolBtn icon={LuLink}  title="Insert Link"  onClick={insertLink} />
            <ToolBtn icon={LuImage} title="Insert Image" onClick={insertImage} />
            <ToolBtn icon={LuMinus} title="Divider"      onClick={insertHr} />
          </>
        )}

        {viewMode === "html" && (
          <button
            type="button"
            onClick={switchToCompose}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
          >
            <LuEye className="h-3.5 w-3.5" /> Back to Compose
          </button>
        )}
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-3xl mx-auto my-6 mx-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm min-h-[480px]">
            {viewMode === "compose" ? (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncContent}
                onBlur={syncContent}
                data-placeholder={placeholder}
                className="rich-editor prose prose-sm max-w-none p-8 min-h-[480px] outline-none text-slate-800 leading-relaxed
                  [&_img]:max-w-full [&_img]:max-h-96 [&_img]:w-auto [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_img]:object-contain
                  empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
              />
            ) : (
              <textarea
                value={htmlSource}
                onChange={handleHtmlChange}
                className="w-full min-h-[480px] p-6 font-mono text-sm text-slate-700 outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
