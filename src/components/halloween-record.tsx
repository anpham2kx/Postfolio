export function HalloweenRecord() {
  return (
    <span className="vinyl-record" aria-hidden="true">
      <svg className="vinyl-label" viewBox="0 0 100 100" focusable="false">
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#b55b21"
          stroke="#e8ac60"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke="#663019"
          strokeWidth=".8"
        />
        <path
          d="m10 24 7 3 4-6 3 7 7 1-6 4-5-1-3 4-2-6Z M70 21l6 3 5-5 1 7 8 1-5 5-6-1-4 4-1-7Z"
          fill="#38231b"
        />
        <path
          d="M49 37c-7-7-24-2-24 15 0 18 12 27 25 27s25-9 25-27c0-17-17-22-24-15Z"
          fill="#f4a044"
          stroke="#6f321b"
          strokeWidth="2"
        />
        <path
          d="M49 38c-4-10 0-16 6-18l4 7c-5 1-7 5-7 11M44 39c-6 13-5 25 1 36m11-36c6 13 5 25-1 36"
          fill="none"
          stroke="#96431d"
          strokeWidth="2.5"
        />
        <path
          d="m34 48 11 7-12 2Zm32 0-11 7 12 2ZM35 63l8 3 3-4 5 5 5-5 3 4 8-3c-5 12-25 12-32 0Z"
          fill="#3d241b"
        />
        <circle
          cx="50"
          cy="50"
          r="3.5"
          fill="#f9dca3"
          stroke="#4c2c20"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

