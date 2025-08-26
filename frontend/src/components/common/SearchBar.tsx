import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  X, 
  Filter, 
  Clock,
  Camera,
  Users,
  Eye,
  Settings,
  Loader2,
  Bell,
  AlertTriangle,
  WifiOff,
  BarChart3,
  Mic,
  MicOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface SearchFilter {
  id: string;
  label: string;
  value: string;
  category?: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  category: string;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface FaceRecognitionSearchSuggestion extends SearchSuggestion {
  confidence?: number; // For person matches
  lastSeen?: string; // For detection searches
  cameraId?: string; // For camera-specific searches
  detectionType?: 'known' | 'unknown'; // For detection filtering
}

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string, filters: SearchFilter[]) => void;
  onClear?: () => void;
  filters?: SearchFilter[];
  availableFilters?: SearchFilter[];
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  debounceMs?: number;
  showFilters?: boolean;
  showSuggestions?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (query: string) => void;
  className?: string;
  // Enhanced props for Face Recognition
  enableVoiceSearch?: boolean;
  showQuickSearches?: boolean;
  onAnalyticsTrack?: (query: string, filters: SearchFilter[], resultCount?: number) => void;
}

// Face Recognition specific quick searches
const FACE_RECOGNITION_QUICK_SEARCHES = [
  {
    id: 'recent-detections',
    text: 'Phát hiện gần đây',
    category: 'Nhận diện',
    icon: <Eye className="h-4 w-4 text-teal-500" />,
    preset: true
  },
  {
    id: 'unknown-persons',
    text: 'Người lạ',
    category: 'Nhận diện',
    icon: <AlertTriangle className="h-4 w-4 text-emerald-500" />,
    preset: true
  },
  {
    id: 'offline-cameras',
    text: 'Camera ngoại tuyến',
    category: 'Camera',
    icon: <WifiOff className="h-4 w-4 text-cyan-500" />,
    preset: true
  },
  {
    id: 'active-alerts',
    text: 'Cảnh báo đang hoạt động',
    category: 'Nhận diện',
    icon: <Bell className="h-4 w-4 text-teal-400" />,
    preset: true
  }
];

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Tìm kiếm...",
  value = "",
  onSearch,
  onClear,
  filters = [],
  availableFilters = [],
  suggestions = [],
  loading = false,
  debounceMs = 300,
  showFilters = true,
  showSuggestions = true,
  recentSearches = [],
  onRecentSearchClick,
  className,
  enableVoiceSearch = false,
  showQuickSearches = true,
  onAnalyticsTrack
}) => {
  const [query, setQuery] = useState(value);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>(filters);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Highlight search matches in text
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  }, []);

  // Enhanced category detection for Face Recognition domain
  const getCategoryIcon = useCallback((category: string) => {
    switch (category.toLowerCase()) {
      case 'camera':
        return <Camera className="h-4 w-4 text-cyan-500" />;
      case 'person':
      case 'user':
      case 'known_person':
        return <Users className="h-4 w-4 text-emerald-500" />;
      case 'detection':
      case 'detection_log':
        return <Eye className="h-4 w-4 text-teal-500" />;
      case 'unknown':
      case 'stranger':
        return <AlertTriangle className="h-4 w-4 text-emerald-500" />;
      case 'setting':
      case 'settings':
        return <Settings className="h-4 w-4 text-gray-400" />;
      case 'alert':
      case 'notification':
        return <Bell className="h-4 w-4 text-teal-400" />;
      case 'analytics':
        return <BarChart3 className="h-4 w-4 text-cyan-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  // Search analytics tracking
  const trackSearch = useCallback((query: string, filters: SearchFilter[], resultCount?: number) => {
    if (query.trim() && onAnalyticsTrack) {
      onAnalyticsTrack(query, filters, resultCount);
    }
  }, [onAnalyticsTrack]);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(searchQuery, activeFilters);
      trackSearch(searchQuery, activeFilters);
    }, debounceMs);
  }, [onSearch, activeFilters, debounceMs, trackSearch]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowDropdown(true);
    setSelectedSuggestionIndex(-1);

    // Filter suggestions based on query
    if (newQuery.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(newQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      debouncedSearch(newQuery);
    } else {
      setFilteredSuggestions([]);
      debouncedSearch("");
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    setQuery(finalQuery);
    setShowDropdown(false);
    onSearch(finalQuery, activeFilters);
    trackSearch(finalQuery, activeFilters);
  };

  // Handle clear
  const handleClear = () => {
    setQuery("");
    setActiveFilters([]);
    setShowDropdown(false);
    setFilteredSuggestions([]);
    onClear?.();
    onSearch("", []);
    searchRef.current?.focus();
  };

  // Handle filter toggle
  const handleFilterToggle = (filter: SearchFilter) => {
    const isActive = activeFilters.some(f => f.id === filter.id);
    const newFilters = isActive
      ? activeFilters.filter(f => f.id !== filter.id)
      : [...activeFilters, filter];
    
    setActiveFilters(newFilters);
    onSearch(query, newFilters);
    trackSearch(query, newFilters);
  };

  // Handle voice search
  const handleVoiceSearch = () => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsVoiceSearchActive(true);
    recognition.onend = () => setIsVoiceSearchActive(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognition.onerror = () => {
      setIsVoiceSearchActive(false);
    };

    recognition.start();
  };

  // Handle keyboard navigation and shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Global shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'k':
          e.preventDefault();
          searchRef.current?.focus();
          return;
        case '/':
          e.preventDefault();
          setShowDropdown(true);
          return;
      }
    }

    if (!showDropdown) return;

    const totalItems = filteredSuggestions.length + 
      (recentSearches.length > 0 ? recentSearches.length : 0) +
      (showQuickSearches && query.trim() === "" ? FACE_RECOGNITION_QUICK_SEARCHES.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          let currentIndex = 0;
          
          // Check suggestions first
          if (selectedSuggestionIndex < filteredSuggestions.length) {
            const suggestion = filteredSuggestions[selectedSuggestionIndex];
            handleSearch(suggestion.text);
            return;
          }
          currentIndex += filteredSuggestions.length;
          
          // Check quick searches
          if (showQuickSearches && query.trim() === "" && 
              selectedSuggestionIndex < currentIndex + FACE_RECOGNITION_QUICK_SEARCHES.length) {
            const quickSearchIndex = selectedSuggestionIndex - currentIndex;
            const quickSearch = FACE_RECOGNITION_QUICK_SEARCHES[quickSearchIndex];
            handleSearch(quickSearch.text);
            return;
          }
          currentIndex += (showQuickSearches && query.trim() === "" ? FACE_RECOGNITION_QUICK_SEARCHES.length : 0);
          
          // Check recent searches
          if (selectedSuggestionIndex < currentIndex + recentSearches.length) {
            const recentIndex = selectedSuggestionIndex - currentIndex;
            const recentSearch = recentSearches[recentIndex];
            handleSearch(recentSearch);
            return;
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced suggestion rendering with metadata
  const renderSuggestion = (suggestion: FaceRecognitionSearchSuggestion, index: number) => (
    <button
      key={suggestion.id}
      className={cn(
        "w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900 flex items-center space-x-3 border-b border-emerald-100 dark:border-emerald-700 last:border-b-0",
        selectedSuggestionIndex === index && "bg-teal-50 dark:bg-teal-900"
      )}
      onClick={() => handleSearch(suggestion.text)}
    >
  <div className="text-emerald-400 dark:text-emerald-500">
        {suggestion.icon || getCategoryIcon(suggestion.category)}
      </div>
      <div className="flex-1 min-w-0">
  <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate">
          {highlightMatch(suggestion.text, query)}
        </div>
        <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-200">
          <span>{suggestion.category}</span>
          {suggestion.confidence && (
            <>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {(suggestion.confidence * 100).toFixed(1)}% khớp
              </span>
            </>
          )}
          {suggestion.lastSeen && (
            <>
              <span>•</span>
              <span>Gần nhất: {suggestion.lastSeen}</span>
            </>
          )}
        </div>
      </div>
      {suggestion.detectionType && (
        <Badge 
          variant={suggestion.detectionType === 'known' ? 'default' : 'destructive'}
          className={cn("text-xs", suggestion.detectionType === 'known' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}
        >
          {suggestion.detectionType === 'known' ? 'Đã biết' : 'Người lạ'}
        </Badge>
      )}
    </button>
  );

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
          <Input
            ref={searchRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            className={cn(
              "pl-10 pr-16",
              showFilters && activeFilters.length > 0 && "pb-8"
            )}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            
            {/* Voice Search Button */}
            {enableVoiceSearch && 'webkitSpeechRecognition' in window && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleVoiceSearch}
                disabled={isVoiceSearchActive}
              >
                {isVoiceSearchActive ? (
                  <MicOff className="h-3 w-3 text-red-500" />
                ) : (
                  <Mic className="h-3 w-3 text-gray-500" />
                )}
              </Button>
            )}
            
            {query && !loading && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}

            {showFilters && availableFilters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(
                    availableFilters.reduce((acc, filter) => {
                      const category = filter.category || 'General';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(filter);
                      return acc;
                    }, {} as Record<string, SearchFilter[]>)
                  ).map(([category, categoryFilters]) => (
                    <div key={category}>
                      <DropdownMenuLabel className="text-xs text-gray-500 uppercase">
                        {category}
                      </DropdownMenuLabel>
                      {categoryFilters.map((filter) => (
                        <DropdownMenuCheckboxItem
                          key={filter.id}
                          checked={activeFilters.some(f => f.id === filter.id)}
                          onCheckedChange={() => handleFilterToggle(filter)}
                        >
                          {filter.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {showFilters && activeFilters.length > 0 && (
          <div className="absolute bottom-1 left-10 right-16 flex flex-wrap gap-1">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="text-xs h-5"
              >
                {filter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 ml-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => handleFilterToggle(filter)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown with Suggestions and Recent Searches */}
      {showDropdown && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border border-emerald-200 dark:border-emerald-700">
          <CardContent className="p-0 max-h-80 overflow-y-auto bg-white dark:bg-slate-900">
            {/* Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200 uppercase tracking-wider border-b border-emerald-100 dark:border-emerald-700">
                  Gợi ý tìm kiếm
                </div>
                {filteredSuggestions.map((suggestion, index) => 
                  renderSuggestion(suggestion as FaceRecognitionSearchSuggestion, index)
                )}
              </div>
            )}

            {/* Quick Searches for Face Recognition */}
            {showQuickSearches && query.trim() === "" && (
              <div>
                {filteredSuggestions.length > 0 && <div className="border-t dark:border-gray-700" />}
                <div className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200 uppercase tracking-wider border-b border-emerald-100 dark:border-emerald-700">
                  Tìm nhanh
                </div>
                {FACE_RECOGNITION_QUICK_SEARCHES.map((quickSearch, index) => (
                  <button
                    key={quickSearch.id}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                      selectedSuggestionIndex === filteredSuggestions.length + index && "bg-blue-50 dark:bg-blue-900"
                    )}
                    onClick={() => handleSearch(quickSearch.text)}
                  >
                    <div className="text-gray-400 dark:text-gray-500">
                      {quickSearch.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate">
                        {quickSearch.text}
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-200">{quickSearch.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && query.trim() === "" && (
              <div>
                {(filteredSuggestions.length > 0 || 
                  (showQuickSearches && FACE_RECOGNITION_QUICK_SEARCHES.length > 0)) && 
                  <div className="border-t dark:border-gray-700" />}
                <div className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200 uppercase tracking-wider border-b border-emerald-100 dark:border-emerald-700">
                  Tìm kiếm gần đây
                </div>
                {recentSearches.slice(0, 5).map((recentSearch, index) => {
                  const adjustedIndex = filteredSuggestions.length + 
                    (showQuickSearches ? FACE_RECOGNITION_QUICK_SEARCHES.length : 0) + index;
                  return (
                    <button
                      key={index}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                        selectedSuggestionIndex === adjustedIndex && "bg-blue-50 dark:bg-blue-900"
                      )}
                      onClick={() => {
                        onRecentSearchClick?.(recentSearch);
                        handleSearch(recentSearch);
                      }}
                    >
                      <Clock className="h-4 w-4 text-emerald-400 dark:text-emerald-500" />
                      <span className="text-sm text-emerald-900 dark:text-emerald-100 truncate">{recentSearch}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {filteredSuggestions.length === 0 && recentSearches.length === 0 && query.trim() && (
              <div className="px-3 py-8 text-center text-emerald-700 dark:text-emerald-200">
                <Search className="h-8 w-8 mx-auto mb-2 text-emerald-200 dark:text-emerald-700" />
                <p className="text-sm">Không tìm thấy kết quả phù hợp</p>
                <p className="text-xs mt-1">Hãy thử từ khóa khác hoặc kiểm tra lại chính tả</p>
              </div>
            )}

            {/* Empty state for no input */}
            {filteredSuggestions.length === 0 && recentSearches.length === 0 && !query.trim() && !showQuickSearches && (
              <div className="px-3 py-8 text-center text-emerald-700 dark:text-emerald-200">
                <Search className="h-8 w-8 mx-auto mb-2 text-emerald-200 dark:text-emerald-700" />
                <p className="text-sm">Nhập từ khóa để tìm kiếm</p>
                <p className="text-xs mt-1">Tìm kiếm camera, người, nhận diện và nhiều hơn nữa</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Preset search bars for common Face Recognition use cases
export const GlobalSearchBar: React.FC<{
  onSearch: (query: string, filters: SearchFilter[]) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
}> = ({ onSearch, suggestions, recentSearches }) => (
  <SearchBar
  placeholder="Tìm kiếm camera, người, nhận diện..."
    onSearch={onSearch}
    suggestions={suggestions}
    recentSearches={recentSearches}
    enableVoiceSearch={true}
    showQuickSearches={true}
    availableFilters={[
      { id: 'camera', label: 'Camera', value: 'camera', category: 'Nội dung' },
      { id: 'person', label: 'Người đã biết', value: 'person', category: 'Nội dung' },
      { id: 'detection', label: 'Nhận diện', value: 'detection', category: 'Nội dung' },
      { id: 'unknown', label: 'Người lạ', value: 'unknown', category: 'Loại nhận diện' },
      { id: 'today', label: 'Hôm nay', value: 'today', category: 'Thời gian' },
      { id: 'this_week', label: 'Tuần này', value: 'this_week', category: 'Thời gian' }
    ]}
  />
);

export const DetectionSearchBar: React.FC<{
  onSearch: (query: string, filters: SearchFilter[]) => void;
  suggestions?: SearchSuggestion[];
}> = ({ onSearch, suggestions }) => (
  <SearchBar
  placeholder="Tìm kiếm nhận diện theo tên người, camera..."
    onSearch={onSearch}
    suggestions={suggestions}
    availableFilters={[
      { id: 'known', label: 'Người đã biết', value: 'known', category: 'Loại nhận diện' },
      { id: 'unknown', label: 'Người lạ', value: 'unknown', category: 'Loại nhận diện' },
      { id: 'high_confidence', label: 'Độ chính xác cao', value: 'high_confidence', category: 'Độ tin cậy' },
      { id: 'today', label: 'Hôm nay', value: 'today', category: 'Thời gian' },
      { id: 'yesterday', label: 'Hôm qua', value: 'yesterday', category: 'Thời gian' },
      { id: 'this_week', label: 'Tuần này', value: 'this_week', category: 'Thời gian' }
    ]}
  />
);

export const PersonSearchBar: React.FC<{
  onSearch: (query: string, filters: SearchFilter[]) => void;
  suggestions?: SearchSuggestion[];
}> = ({ onSearch, suggestions }) => (
  <SearchBar
  placeholder="Tìm kiếm người đã biết..."
    onSearch={onSearch}
    suggestions={suggestions}
    availableFilters={[
      { id: 'recently_added', label: 'Thêm gần đây', value: 'recently_added', category: 'Thời gian' },
      { id: 'frequently_detected', label: 'Phát hiện thường xuyên', value: 'frequently_detected', category: 'Hoạt động' },
      { id: 'multiple_images', label: 'Nhiều ảnh', value: 'multiple_images', category: 'Chất lượng dữ liệu' }
    ]}
  />
);

export const CameraSearchBar: React.FC<{
  onSearch: (query: string, filters: SearchFilter[]) => void;
  suggestions?: SearchSuggestion[];
}> = ({ onSearch, suggestions }) => (
  <SearchBar
  placeholder="Tìm kiếm camera..."
    onSearch={onSearch}
    suggestions={suggestions}
    availableFilters={[
      { id: 'online', label: 'Đang hoạt động', value: 'online', category: 'Trạng thái' },
      { id: 'offline', label: 'Ngoại tuyến', value: 'offline', category: 'Trạng thái' },
      { id: 'streaming', label: 'Đang phát', value: 'streaming', category: 'Trạng thái' },
      { id: 'detection_enabled', label: 'Bật nhận diện', value: 'detection_enabled', category: 'Tính năng' }
    ]}
  />
);

export default SearchBar;