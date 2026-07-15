import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useRegister } from '../RegisterContext';

const UploadArrow = (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const Check = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Drag/drop logo upload zone (shows filename + size once a file is picked). */
export function LogoUpload({ accept = 'image/png,image/svg+xml,image/jpeg,image/webp' }) {
  const { showToast } = useRegister();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const onFile = (f) => {
    if (!f) return;
    setFile(f);
    showToast('Logo uploaded successfully.', 'success');
  };

  return (
    <div className="form-group">
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files[0])}
      />
      <div
        className="logo-upload-zone"
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files[0]);
        }}
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          textAlign: 'left',
          ...(dragging
            ? { borderColor: 'var(--saffron)', background: 'rgba(238,242,255,0.5)' }
            : null),
        }}
      >
        <div
          className="upload-icon"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            margin: 0,
            ...(file ? { background: 'rgba(5,150,105,0.15)', color: 'var(--green)' } : null),
          }}
        >
          {file ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>
        <div>
          <div className="upload-title" style={{ fontSize: 13 }}>
            {file ? file.name : 'Drop your logo here or click to upload'}
          </div>
          <div className="upload-sub" style={{ fontSize: 11.5 }}>
            {file
              ? `${(file.size / 1024).toFixed(0)} KB · Click to change`
              : 'PNG / SVG / JPG · Max 2MB · Square format preferred'}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Verification document card with an upload button. */
export function VerificationCard({ icon, title, sub, accept = '.pdf,.jpg,.jpeg,.png' }) {
  const { showToast } = useRegister();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  return (
    <div className={cn('verification-card', file && 'verified')}>
      <div className="v-icon-wrap">{icon}</div>
      <div className="v-title">{title}</div>
      <div className="v-sub">{sub}</div>
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files.length) {
            setFile(e.target.files[0]);
            showToast('Document uploaded.', 'success');
          }
        }}
      />
      <button
        type="button"
        className={cn('p-upload-btn', file && 'has-file')}
        onClick={() => inputRef.current.click()}
      >
        {file ? Check : UploadArrow}
        {file ? file.name : 'Upload document'}
      </button>
    </div>
  );
}

/** Standalone upload button (e.g. company profile / brochure). */
export function UploadButton({ label, accept, multiple, style, onUploaded }) {
  const { showToast } = useRegister();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  return (
    <>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files.length) {
            setFile(e.target.files[0]);
            showToast(onUploaded || 'File uploaded.', 'success');
          }
        }}
      />
      <button
        type="button"
        className={cn('p-upload-btn', file && 'has-file')}
        style={style}
        onClick={() => inputRef.current.click()}
      >
        {file ? Check : UploadArrow}
        {file ? file.name : label}
      </button>
    </>
  );
}

/** A single attachment drop zone in the attach grid. */
export function AttachZone({ icon, title, sub, accept, multiple = true }) {
  const { showToast } = useRegister();
  const inputRef = useRef(null);
  const [count, setCount] = useState(0);

  return (
    <div
      className={cn('attach-zone', count > 0 && 'has-file')}
      onClick={() => inputRef.current.click()}
    >
      <div className="attach-icon">{icon}</div>
      <div>
        <div className="attach-title">{title}</div>
        <div className="attach-sub">
          {count > 0 ? `${count} ${count === 1 ? 'file' : 'files'} selected` : sub}
        </div>
      </div>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const n = e.target.files.length;
          if (n) {
            setCount(n);
            showToast(`${n} ${n === 1 ? 'file' : 'files'} added.`, 'success');
          }
        }}
      />
    </div>
  );
}
