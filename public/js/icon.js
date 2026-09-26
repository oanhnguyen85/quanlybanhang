window.Icon = (function () {
  function S(p, o) { o = o || {}; var w = o.w || 20, sw = o.sw || 1.9;
    return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
  return {
    dash: function(o){return S('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',o);},
    box: function(o){return S('<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>',o);},
    batch: function(o){return S('<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/><path d="M7.5 5.2l9 4"/>',o);},
    import: function(o){return S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',o);},
    cart: function(o){return S('<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21.5 7H6"/>',o);},
    stack: function(o){return S('<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',o);},
    wallet: function(o){return S('<rect x="2" y="5" width="20" height="15" rx="2.5"/><path d="M2 10h20M16 15h2"/>',o);},
    chart: function(o){return S('<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',o);},
    gear: function(o){return S('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',o);},
    plus: function(o){return S('<path d="M12 5v14M5 12h14"/>',{w:(o&&o.w)||20,sw:2.4});},
    edit: function(o){return S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',o);},
    trash: function(o){return S('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',o);},
    close: function(o){return S('<path d="M18 6L6 18M6 6l12 12"/>',{w:(o&&o.w)||20,sw:2.4});},
    check: function(o){return S('<path d="M20 6L9 17l-5-5"/>',{w:(o&&o.w)||20,sw:2.6});},
    search: function(o){return S('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',o);},
    arrowDown: function(o){return S('<path d="M12 5v14M19 12l-7 7-7-7"/>',o);},
    arrowUp: function(o){return S('<path d="M12 19V5M5 12l7-7 7 7"/>',o);},
    warn: function(o){return S('<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',o);},
    clock: function(o){return S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',o);},
    users: function(o){return S('<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 3-5.6 6.5-5.6s6.5 2.2 6.5 5.6"/><path d="M17 5.2a3.4 3.4 0 0 1 0 6.6M18.5 14.6c2.1.6 3.6 2.2 3.6 4.4"/>',o);},
    receipt: function(o){return S('<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',o);},
    save: function(o){return S('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',o);},
    download: function(o){return S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',o);},
    globe: function(o){return S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3z"/>',o);},
    menu: function(o){return S('<path d="M3 6h18M3 12h18M3 18h18"/>',{w:(o&&o.w)||20,sw:2.2});},
    coin: function(o){return S('<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5h4a1.9 1.9 0 0 1 0 3.8h-4M9.5 12.3h4a1.9 1.9 0 0 1 0 3.8M12 6.5v11"/>',o);},
    scale: function(o){return S('<path d="M12 3v18M6 21h12"/><path d="M3 7h18"/><path d="M6 7l-3 6h6L6 7zM18 7l-3 6h6l-3-6z"/>',o);},
    lock: function(o){return S('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',o);},
    unlock: function(o){return S('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',o);},
    truck: function(o){return S('<path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7z"/><circle cx="5" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',o);},
    tax: function(o){return S('<path d="M9 14l6-6"/><circle cx="9.5" cy="9.5" r="1.8"/><circle cx="14.5" cy="14.5" r="1.8"/><rect x="3" y="3" width="18" height="18" rx="3"/>',o);}
  };
})();
