import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useRegister } from '@/features/register';

const ChevronDown = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CheckSmall = (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PlusIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const XIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const headerStyle = (compact) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: compact ? '11px 14px' : '12px 16px',
  border: '1px solid var(--border-medium)',
  borderRadius: 10,
  cursor: 'pointer',
  background: 'var(--white)',
  transition: 'all 0.2s',
  userSelect: 'none',
});
const subStyle = {
  display: 'flex',
  padding: '12px 16px 14px',
  border: '1px solid var(--border-medium)',
  borderTop: 'none',
  borderRadius: '0 0 10px 10px',
  background: 'var(--cream)',
  flexWrap: 'wrap',
  gap: 8,
};

/**
 * Expandable category accordion used for both Services and Industries.
 * Selections are stored in the RegisterProvider selection `group` as "cat:item".
 *
 * @param {object} props
 * @param {string} props.group
 * @param {{ key: string, title: string, items: string[] }[]} props.categories
 * @param {boolean} [props.headerCheckbox]  when true, header checkbox toggles all items
 */
export function CategoryAccordion({ group, categories, headerCheckbox }) {
  const { selection, isSelected, toggleSelection } = useRegister();
  const [open, setOpen] = useState(null);
  const selected = selection(group);

  const countFor = (cat) => cat.items.filter((it) => selected.includes(`${cat.key}:${it}`)).length;

  const toggleAll = (cat, checked) => {
    cat.items.forEach((it) => {
      const val = `${cat.key}:${it}`;
      if (checked && !isSelected(group, val)) toggleSelection(group, val);
      if (!checked && isSelected(group, val)) toggleSelection(group, val);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {categories.map((cat) => {
        const count = countFor(cat);
        const isOpen = open === cat.key;
        return (
          <div key={cat.key}>
            <div
              style={headerStyle(headerCheckbox)}
              onClick={() => setOpen(isOpen ? null : cat.key)}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}
                onClick={headerCheckbox ? (e) => e.stopPropagation() : undefined}
              >
                {headerCheckbox ? (
                  <input
                    type="checkbox"
                    checked={count === cat.items.length && count > 0}
                    onChange={(e) => toggleAll(cat, e.target.checked)}
                    style={{ accentColor: 'var(--gold)', width: 15, height: 15, flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: 5,
                      border: '1.5px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: count > 0 ? 'var(--gold)' : undefined,
                      borderColor: count > 0 ? 'var(--gold)' : undefined,
                      color: count > 0 ? '#fff' : 'transparent',
                    }}
                  >
                    {CheckSmall}
                  </div>
                )}
                <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>
                  {cat.title}
                </span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: 'var(--gold)',
                      color: '#fff',
                      borderRadius: 50,
                      padding: '2px 8px',
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--ink-faint)',
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                {ChevronDown}
              </span>
            </div>
            {isOpen && (
              <div style={subStyle}>
                {cat.items.map((it) => {
                  const val = `${cat.key}:${it}`;
                  return (
                    <label key={it} className="sub-pill">
                      <input
                        type="checkbox"
                        checked={isSelected(group, val)}
                        onChange={() => toggleSelection(group, val)}
                      />{' '}
                      {it}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Key clients (logo box + name), add/remove up to 5 ── */
function ClientLogoBox() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  return (
    <div style={{ flexShrink: 0 }}>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <div
        onClick={() => inputRef.current.click()}
        title="Click to upload client logo"
        style={{
          width: 46,
          height: 46,
          border: '1.5px dashed rgba(13,17,23,0.15)',
          borderRadius: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: url ? '#fff' : '#FAFBFD',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {url ? (
          <img
            src={url}
            alt="client"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink-faint)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
    </div>
  );
}

export function KeyClients() {
  const { field, setField } = useRegister();
  const [rows, setRows] = useState([1, 2, 3]);
  return (
    <div className="form-group">
      <label>
        Key Clients <span className="opt">(optional · max 5)</span>
      </label>
      <div className="client-instruction">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Click the image box to upload your client&apos;s logo, then type the client name beside it.
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--ink-muted)',
          fontWeight: 300,
          marginBottom: 12,
          paddingLeft: 10,
          borderLeft: '2px solid rgba(217,119,6,0.35)',
          lineHeight: 1.6,
        }}
      >
        Displaying recognisable client logos builds trust and significantly boosts your
        profile&apos;s credibility with new prospects.
      </div>
      {rows.map((id, i) => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <ClientLogoBox />
          <input
            type="text"
            className="form-control"
            placeholder="Client name"
            style={{ marginBottom: 0 }}
            value={field(`f_client${id}`)}
            onChange={(e) => setField(`f_client${id}`, e.target.value)}
          />
          {i >= 2 && (
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((x) => x !== id))}
              title="Remove client"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-faint)',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {XIcon}
            </button>
          )}
        </div>
      ))}
      {rows.length < 5 && (
        <button
          type="button"
          onClick={() => setRows((r) => [...r, (r[r.length - 1] || 0) + 1])}
          className="add-portfolio-btn"
          style={{ marginTop: 4 }}
        >
          {PlusIcon}
          Add Key Client
        </button>
      )}
    </div>
  );
}

/* ── Portfolio / case studies ── */
function PortfolioItem({ id, onRemove }) {
  const { field, setField } = useRegister();
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  return (
    <div className="portfolio-item">
      <div className="portfolio-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div className="portfolio-title">
          <input
            type="text"
            className="p-title-input"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--ink)',
              outline: 'none',
              width: '100%',
            }}
            placeholder="Campaign name or project title"
            value={field(`f_pf_title_${id}`)}
            onChange={(e) => setField(`f_pf_title_${id}`, e.target.value)}
          />
        </div>
        <div className="portfolio-meta">
          <input
            type="text"
            className="p-meta-input"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              color: 'var(--ink-faint)',
              fontWeight: 300,
              outline: 'none',
              width: '100%',
            }}
            placeholder="Budget · Billboards · Duration · Industry"
            value={field(`f_pf_meta_${id}`)}
            onChange={(e) => setField(`f_pf_meta_${id}`, e.target.value)}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
            ref={inputRef}
            style={{ display: 'none' }}
            onChange={(e) => setFileName(e.target.files[0]?.name || null)}
          />
          <div
            className={cn('p-upload-btn', fileName && 'has-file')}
            onClick={() => inputRef.current.click()}
          >
            <span>
              {fileName || (
                <>
                  Attach case study file{' '}
                  <span style={{ fontSize: 10.5, fontWeight: 300, opacity: 0.7 }}>
                    PDF, PPT, DOC, or image
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-faint)',
            padding: '4px 8px',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {XIcon}
        </button>
      )}
    </div>
  );
}

export function Portfolio() {
  const [items, setItems] = useState([1, 2]);
  return (
    <div className="form-section" id="portfolioSection" style={{ marginTop: 8 }}>
      <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Portfolio / Case Studies{' '}
        <span
          style={{
            fontSize: 10,
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 0,
            color: 'var(--ink-faint)',
          }}
        >
          optional — strongly recommended
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
      </div>
      <div className="portfolio-list">
        {items.map((id) => (
          <PortfolioItem
            key={id}
            id={id}
            onRemove={() => setItems((it) => it.filter((x) => x !== id))}
          />
        ))}
      </div>
      <button
        type="button"
        className="add-portfolio-btn"
        onClick={() => setItems((it) => [...it, (it[it.length - 1] || 0) + 1])}
      >
        {PlusIcon}
        Add Case Study / Campaign
      </button>
    </div>
  );
}
