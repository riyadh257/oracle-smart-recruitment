import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, X, Plus } from "lucide-react";

export interface CandidateFilterState {
  searchQuery?: string;
  skills?: string[];
  location?: string;
  minExperience?: number;
  maxExperience?: number;
  isAvailable?: boolean;
  profileStatus?: "incomplete" | "active" | "inactive";
  preferredWorkSetting?: "remote" | "hybrid" | "onsite" | "flexible";
}

interface CandidateFiltersProps {
  filters: CandidateFilterState;
  onFiltersChange: (filters: CandidateFilterState) => void;
  onSearch: () => void;
}

const COMMON_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Git",
  "Agile",
];

export default function CandidateFilters({
  filters,
  onFiltersChange,
  onSearch,
}: CandidateFiltersProps) {
  const [skillInput, setSkillInput] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateFilter = (key: keyof CandidateFilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !filters.skills?.includes(trimmedSkill)) {
      updateFilter("skills", [...(filters.skills || []), trimmedSkill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    updateFilter(
      "skills",
      filters.skills?.filter((s) => s !== skill)
    );
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof CandidateFilterState] !== undefined
  ).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or headline..."
            value={filters.searchQuery || ""}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => addSkill(skillInput)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {filters.skills && filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_SKILLS.filter(
                    (skill) => !filters.skills?.includes(skill)
                  ).map((skill) => (
                    <Button
                      key={skill}
                      variant="ghost"
                      size="sm"
                      onClick={() => addSkill(skill)}
                      className="h-7 text-xs"
                    >
                      + {skill}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Riyadh, Remote"
                  value={filters.location || ""}
                  onChange={(e) => updateFilter("location", e.target.value)}
                />
              </div>

              {/* Experience Range */}
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minExperience || ""}
                    onChange={(e) =>
                      updateFilter(
                        "minExperience",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    min={0}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxExperience || ""}
                    onChange={(e) =>
                      updateFilter(
                        "maxExperience",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select
                  value={
                    filters.isAvailable === undefined
                      ? "all"
                      : filters.isAvailable
                      ? "available"
                      : "unavailable"
                  }
                  onValueChange={(value) =>
                    updateFilter(
                      "isAvailable",
                      value === "all"
                        ? undefined
                        : value === "available"
                    )
                  }
                >
                  <SelectTrigger id="availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Status */}
              <div className="space-y-2">
                <Label htmlFor="profileStatus">Profile Status</Label>
                <Select
                  value={filters.profileStatus || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "profileStatus",
                      value === "all" ? undefined : value
                    )
                  }
                >
                  <SelectTrigger id="profileStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Setting */}
              <div className="space-y-2">
                <Label htmlFor="workSetting">Preferred Work Setting</Label>
                <Select
                  value={filters.preferredWorkSetting || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "preferredWorkSetting",
                      value === "all" ? undefined : value
                    )
                  }
                >
                  <SelectTrigger id="workSetting">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button
                className="w-full"
                onClick={() => {
                  onSearch();
                  setIsFilterOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badges */}
        {filters.skills && filters.skills.length > 0 && (
          <Badge variant="secondary">
            Skills: {filters.skills.length}
          </Badge>
        )}
        {filters.location && (
          <Badge variant="secondary">
            Location: {filters.location}
          </Badge>
        )}
        {(filters.minExperience !== undefined ||
          filters.maxExperience !== undefined) && (
          <Badge variant="secondary">
            Experience: {filters.minExperience || 0}-
            {filters.maxExperience || "∞"}
          </Badge>
        )}
      </div>
    </div>
  );
}
