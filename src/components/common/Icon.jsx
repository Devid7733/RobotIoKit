export default function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    search: (
      <path
        d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    cart: (
      <path
        d="M3 4h1.5l1.8 9.1a1 1 0 001 .8h8.8a1 1 0 001-.8L19 7H6.2m2.1 11.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm8 0a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    user: (
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    chevronDown: (
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    arrowRight: (
      <path
        d="M5 12h14m-5-5l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    chat: (
      <path
        d="M7 17l-3 3v-4a8 8 0 118 8H7z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    chip: (
      <path
        d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m12 0h3M3 15h3m12 0h3M8 7h8a1 1 0 011 1v8a1 1 0 01-1 1H8a1 1 0 01-1-1V8a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    pulse: (
      <path
        d="M3 12h4l2.2-5 3.6 10 2.2-5H21"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    bolt: (
      <path
        d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    radio: (
      <path
        d="M5 12a7 7 0 0114 0m-11 0a4 4 0 018 0m-4 0h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    cube: (
      <path
        d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2zm0 0v18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    wrench: (
      <path
        d="M14 7a4 4 0 01-5 5L4 17l3 3 5-5a4 4 0 005-5l-3 3-3-3 3-3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    wifi: (
      <path
        d="M2 8a16 16 0 0120 0M5 12a11 11 0 0114 0m-11 4a6 6 0 018 0m-4 3h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    trash: (
      <path
        d="M4 7h16m-2 0l-1 13H7L6 7m3-3h6l1 3H8l1-3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    eye: (
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zm10 2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    eyeOff: (
      <path
        d="M3 3l18 18M10.6 10.6a2.5 2.5 0 003.5 3.5M9.4 5.5A10.8 10.8 0 0112 5c6.5 0 10 6 10 6a13.6 13.6 0 01-3.1 3.8M6.6 6.6C4.3 8.1 2 11 2 11s3.5 6 10 6c1.2 0 2.3-.2 3.3-.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    logout: (
      <path
        d="M10 17l-5-5 5-5m-5 5h12M13 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    package: (
      <path
        d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2zm0 0v18m8-13.5l-8 4.5-8-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    checkCircle: (
      <path
        d="M9 12l2 2 4-5m7 3a9 9 0 11-18 0 9 9 0 0118 0z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    store: (
      <path
        d="M4 10h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9zm1-6h14l1 4H4l1-4zm4 9v7m6-7v7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    creditCard: (
      <path
        d="M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 3h18M7 15h3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    bell: (
      <path
        d="M15 17H5.5a1.5 1.5 0 01-1.2-2.4L6 12.5V9a6 6 0 1112 0v3.5l1.7 2.1a1.5 1.5 0 01-1.2 2.4H15m0 0a3 3 0 11-6 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    settings: (
      <path
        d="M12 8.5A3.5 3.5 0 1112 15.5 3.5 3.5 0 0112 8.5zm7 3.5l2 1-2 1a7.9 7.9 0 01-.7 1.7l.7 2.2-2.2.7A7.9 7.9 0 0115 20l-1 2-1-2a7.9 7.9 0 01-2 0l-1 2-1-2a7.9 7.9 0 01-1.7-.7l-2.2.7-.7-2.2A7.9 7.9 0 014 15l-2-1 2-1a7.9 7.9 0 010-2l-2-1 2-1a7.9 7.9 0 01.7-1.7l-.7-2.2 2.2-.7A7.9 7.9 0 019 4l1-2 1 2a7.9 7.9 0 012 0l1-2 1 2a7.9 7.9 0 011.7.7l2.2-.7.7 2.2A7.9 7.9 0 0120 9l2 1-2 1a7.9 7.9 0 010 2z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    ),
    dashboard: (
      <path
        d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h4v7H4v-7zm6 3h10v4H10v-4z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    calendar: (
      <path
        d="M7 3v3m10-3v3M4 8h16M5 5h14a1 1 0 011 1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    trendUp: (
      <path
        d="M4 16l6-6 4 4 6-7M14 7h6v6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    clock: (
      <path
        d="M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    alertTriangle: (
      <path
        d="M12 4l8 14H4l8-14zm0 5v4m0 3h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    xCircle: (
      <path
        d="M15 9l-6 6m0-6l6 6m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    users: (
      <path
        d="M17 20a5 5 0 00-10 0M12 12a4 4 0 100-8 4 4 0 000 8zm6 2a3 3 0 016 0m-9 0H9m9-8a3 3 0 100-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    menu: (
      <path
        d="M4 6h16M4 12h16M4 18h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    ),
    lock: (
      <path
        d="M6 11V8a6 6 0 1112 0v3m-13 0h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9zm7 5v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    )
  };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {icons[name]}
    </svg>
  );
}
