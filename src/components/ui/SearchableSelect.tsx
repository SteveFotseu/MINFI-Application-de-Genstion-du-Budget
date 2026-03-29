// ============================================================
// FICHIER  : src/components/ui/SearchableSelect.tsx
// RÔLE     : Liste déroulante avec recherche intégrée.
//            Supporte la sélection simple et multiple.
//            Entièrement accessible (clavier, ARIA).
// ============================================================

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectOption {
  id:    string;
  label: string;
  code?: string; // Affichage secondaire optionnel (ex: "P-001")
}

// ── Props sélection SIMPLE ──────────────────────────────────
interface SingleProps {
  multiple:    false;
  value:       string;           // ID de l'option sélectionnée
  onChange:    (id: string) => void;
}

// ── Props sélection MULTIPLE ────────────────────────────────
interface MultipleProps {
  multiple:    true;
  value:       string[];         // IDs des options sélectionnées
  onChange:    (ids: string[]) => void;
}

type SearchableSelectProps = {
  id?:          string;
  label:        string;
  placeholder?: string;
  options:      SelectOption[];
  error?:       string;
  disabled?:    boolean;
  icon?:        React.ReactNode;
} & (SingleProps | MultipleProps);

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  placeholder = 'Rechercher…',
  options,
  error,
  disabled = false,
  icon,
  ...rest
}) => {
  const [isOpen,  setIsOpen]  = useState(false);
  const [search,  setSearch]  = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus sur la recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtrage des options selon la recherche
  const filtered = options.filter(opt => {
    if (!opt || !opt.id) return false;
    const q = search.toLowerCase();
    const label = (opt.label ?? '').toLowerCase();
    const code  = (opt.code  ?? '').toLowerCase();
    if (!q) return true;
    return label.includes(q) || code.includes(q);
  });

  // ── Helpers selon mode ──
  const isMultiple = rest.multiple;

  const isSelected = useCallback((id: string): boolean => {
    if (isMultiple) return (rest as MultipleProps).value.includes(id);
    return (rest as SingleProps).value === id;
  }, [isMultiple, rest]);

  const handleSelect = (optId: string) => {
    if (isMultiple) {
      const current = (rest as MultipleProps).value;
      const next = current.includes(optId)
        ? current.filter(v => v !== optId)
        : [...current, optId];
      (rest as MultipleProps).onChange(next);
    } else {
      (rest as SingleProps).onChange(optId);
      setIsOpen(false);
      setSearch('');
    }
  };

  // Texte affiché dans le trigger
  const triggerText = (): string => {
    if (isMultiple) {
      const ids = (rest as MultipleProps).value;
      if (ids.length === 0) return '';
      if (ids.length === 1) {
        return options.find(o => o.id === ids[0])?.label ?? '';
      }
      return `${ids.length} programme(s) sélectionné(s)`;
    } else {
      const id = (rest as SingleProps).value;
      return options.find(o => o.id === id)?.label ?? '';
    }
  };

  const hasValue = isMultiple
    ? (rest as MultipleProps).value.length > 0
    : !!(rest as SingleProps).value;

  const fieldId = id ?? label.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="inp-group" ref={containerRef} style={{ position: 'relative' }}>

      {/* Label */}
      <label className="inp-label" htmlFor={`${fieldId}-trigger`}>
        {label}
      </label>

      {/* Trigger */}
      <button
        id={`${fieldId}-trigger`}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
        onClick={() => { if (!disabled) setIsOpen(v => !v); }}
        style={{
          width:          '100%',
          height:         46,
          border:         `1.5px solid ${error ? 'var(--clr-danger)' : isOpen ? 'var(--clr-navy)' : 'var(--clr-gray-200)'}`,
          borderRadius:   'var(--radius-md)',
          background:     'var(--clr-white)',
          display:        'flex',
          alignItems:     'center',
          gap:            8,
          padding:        '0 12px 0 40px',
          cursor:         disabled ? 'not-allowed' : 'pointer',
          fontFamily:     'var(--font-body)',
          fontSize:       '.875rem',
          color:          hasValue ? 'var(--clr-gray-800)' : 'var(--clr-gray-200)',
          textAlign:      'left',
          boxShadow:      isOpen ? '0 0 0 3px rgba(13,43,85,.08)' : error ? '0 0 0 3px rgba(206,17,38,.07)' : 'none',
          transition:     'border-color 150ms ease, box-shadow 150ms ease',
          opacity:        disabled ? 0.52 : 1,
          position:       'relative',
        }}
      >
        {/* Icône gauche */}
        {icon && (
          <span style={{
            position:  'absolute',
            left:      13,
            top:       '50%',
            transform: 'translateY(-50%)',
            color:     isOpen ? 'var(--clr-navy)' : 'var(--clr-gray-300)',
            display:   'flex',
            alignItems:'center',
            transition:'color 150ms ease',
          }}>
            {icon}
          </span>
        )}

        {/* Texte sélectionné ou placeholder */}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasValue ? triggerText() : placeholder}
        </span>

        {/* Tags multi sélection */}
        {isMultiple && (rest as MultipleProps).value.length > 0 && (
          <span style={{
            background:   'var(--clr-navy)',
            color:        '#fff',
            borderRadius: 999,
            fontSize:     '.7rem',
            fontWeight:   700,
            padding:      '1px 7px',
            flexShrink:   0,
          }}>
            {(rest as MultipleProps).value.length}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--clr-gray-400)" strokeWidth="2"
          style={{
            flexShrink: 0,
            transform:  isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position:    'absolute',
          top:         '100%',
          left:        0,
          right:       0,
          marginTop:   4,
          background:  'var(--clr-white)',
          border:      '1.5px solid var(--clr-gray-200)',
          borderRadius:'var(--radius-md)',
          boxShadow:   'var(--shadow-md)',
          zIndex:      200,
          overflow:    'hidden',
          animation:   'fadeSlideDown .18s ease',
        }}>

          {/* Champ de recherche */}
          <div style={{
            padding:    '8px 10px',
            borderBottom: '1px solid var(--clr-gray-100)',
            position:   'relative',
          }}>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="var(--clr-gray-400)" strokeWidth="2"
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{
                width:        '100%',
                height:       34,
                border:       '1.5px solid var(--clr-gray-200)',
                borderRadius: 'var(--radius-sm)',
                padding:      '0 10px 0 34px',
                fontFamily:   'var(--font-body)',
                fontSize:     '.82rem',
                outline:      'none',
                color:        'var(--clr-gray-800)',
              }}
              onKeyDown={e => { if (e.key === 'Escape') { setIsOpen(false); setSearch(''); } }}
            />
          </div>

          {/* Liste des options */}
          <ul
            role="listbox"
            aria-multiselectable={isMultiple}
            style={{
              maxHeight:  220,
              overflowY:  'auto',
              margin:     0,
              padding:    '4px 0',
              listStyle:  'none',
            }}
          >
            {filtered.length === 0 ? (
              <li style={{
                padding:   '10px 14px',
                fontSize:  '.82rem',
                color:     'var(--clr-gray-400)',
                textAlign: 'center',
              }}>
                Aucun résultat pour « {search} »
              </li>
            ) : (
              filtered.map(opt => {
                const selected = isSelected(opt.id);
                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(opt.id)}
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         10,
                      padding:     '8px 14px',
                      cursor:      'pointer',
                      background:  selected ? 'rgba(13,43,85,.05)' : 'transparent',
                      transition:  'background 120ms ease',
                      fontSize:    '.85rem',
                    }}
                    onMouseEnter={e => {
                      if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--clr-gray-50)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = selected ? 'rgba(13,43,85,.05)' : 'transparent';
                    }}
                  >
                    {/* Checkbox visuelle pour le mode multiple */}
                    {isMultiple && (
                      <span style={{
                        width:        16,
                        height:       16,
                        borderRadius: 4,
                        border:       `2px solid ${selected ? 'var(--clr-navy)' : 'var(--clr-gray-300)'}`,
                        background:   selected ? 'var(--clr-navy)' : 'transparent',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'center',
                        flexShrink:   0,
                        transition:   'all 150ms ease',
                      }}>
                        {selected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        )}
                      </span>
                    )}

                    {/* Mode simple : coche à droite */}
                    <div style={{ flex: 1 }}>
                      <span style={{
                        color:      selected ? 'var(--clr-navy)' : 'var(--clr-gray-800)',
                        fontWeight: selected ? 600 : 400,
                      }}>
                        {opt.label}
                      </span>
                      {opt.code && (
                        <span style={{
                          marginLeft: 6,
                          fontSize:   '.73rem',
                          color:      'var(--clr-gray-400)',
                        }}>
                          {opt.code}
                        </span>
                      )}
                    </div>

                    {!isMultiple && selected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-navy)" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Pied dropdown multi : bouton tout désélectionner */}
          {isMultiple && (rest as MultipleProps).value.length > 0 && (
            <div style={{
              borderTop:  '1px solid var(--clr-gray-100)',
              padding:    '6px 14px',
              display:    'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => (rest as MultipleProps).onChange([])}
                style={{
                  background:  'none',
                  border:      'none',
                  cursor:      'pointer',
                  fontSize:    '.75rem',
                  color:       'var(--clr-gray-400)',
                  fontFamily:  'var(--font-body)',
                  padding:     '2px 0',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--clr-gray-400)')}
              >
                Tout désélectionner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="inp-error-msg" role="alert">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8"  x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;