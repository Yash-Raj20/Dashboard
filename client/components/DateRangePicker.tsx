import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | null) => void;
  className?: string;
}

const presetRanges = [
  {
    label: 'Today',
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    },
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 14 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 13)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 3 months',
    getValue: () => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: endOfDay(new Date()),
    }),
  },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    const range = preset.getValue();
    onChange({
      ...range,
      label: preset.label,
    });
    setIsOpen(false);
  };

  const handleCustomRangeSelect = () => {
    if (customRange.from && customRange.to) {
      onChange({
        from: startOfDay(customRange.from),
        to: endOfDay(customRange.to),
        label: `${format(customRange.from, 'MMM dd')} - ${format(customRange.to, 'MMM dd')}`,
      });
      setIsOpen(false);
      setCustomRange({});
    }
  };

  const handleClear = () => {
    onChange(null);
    setCustomRange({});
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              <span>{value.label}</span>
            ) : (
              <span className="text-muted-foreground">Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset Options */}
            <div className="border-r p-4 space-y-2">
              <h4 className="font-medium text-sm mb-3">Quick Select</h4>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Calendar */}
            <div className="p-4">
              <h4 className="font-medium text-sm mb-3">Custom Range</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">From</label>
                  <Calendar
                    mode="single"
                    selected={customRange.from}
                    onSelect={(date) => setCustomRange(prev => ({ ...prev, from: date }))}
                    className="rounded-md border"
                  />
                </div>
                
                {customRange.from && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">To</label>
                    <Calendar
                      mode="single"
                      selected={customRange.to}
                      onSelect={(date) => setCustomRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => date < customRange.from!}
                      className="rounded-md border"
                    />
                  </div>
                )}

                {customRange.from && customRange.to && (
                  <Button onClick={handleCustomRangeSelect} className="w-full">
                    Apply Custom Range
                  </Button>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {value && (
        <Button variant="outline" size="sm" onClick={handleClear}>
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}

// Advanced filter component for analytics
export interface AnalyticsFilters {
  dateRange?: DateRange;
  userRole?: string;
  activityType?: string;
  status?: string;
}

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  className?: string;
}

export function AnalyticsFilterBar({ filters, onFiltersChange, className }: AnalyticsFilterBarProps) {
  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Date Range</label>
          <DateRangePicker
            value={filters.dateRange}
            onChange={(range) => handleFilterChange('dateRange', range)}
          />
        </div>

        {/* User Role Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">User Role</label>
          <Select
            value={filters.userRole || 'all'}
            onValueChange={(value) => handleFilterChange('userRole', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="main-admin">Main Admin</SelectItem>
              <SelectItem value="sub-admin">Sub Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Type Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Activity Type</label>
          <Select
            value={filters.activityType || 'all'}
            onValueChange={(value) => handleFilterChange('activityType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activities</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="create_user">Create User</SelectItem>
              <SelectItem value="update_user">Update User</SelectItem>
              <SelectItem value="delete_user">Delete User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.dateRange.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('dateRange', undefined)}
              />
            </Badge>
          )}
          {filters.userRole && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Role: {filters.userRole}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('userRole', undefined)}
              />
            </Badge>
          )}
          {filters.activityType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Activity: {filters.activityType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('activityType', undefined)}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('status', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
