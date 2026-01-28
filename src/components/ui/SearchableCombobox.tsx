import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  className?: string;
  loading?: boolean;
}

export default function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = 'Type or select...',
  icon,
  required = false,
  className = '',
  loading = false,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on input
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault();
      handleOptionClick(filteredOptions[0]);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none`}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading suggestions...</div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleOptionClick(option)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
              >
                <span className={option === value ? 'font-medium text-primary' : 'text-gray-700'}>
                  {option}
                </span>
                {option === value && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))
          ) : inputValue ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Press Enter to use "<span className="font-medium">{inputValue}</span>"
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">Type to search or add new...</div>
          )}
        </div>
      )}
    </div>
  );
}
