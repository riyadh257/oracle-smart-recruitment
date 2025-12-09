import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code2, User, Briefcase, Calendar, MapPin, DollarSign } from "lucide-react";

interface Variable {
  key: string;
  label: string;
  description: string;
  example: string;
}

interface VariableGroup {
  label: string;
  icon: React.ReactNode;
  variables: Variable[];
}

const variableGroups: VariableGroup[] = [
  {
    label: "Candidate Information",
    icon: <User className="h-4 w-4" />,
    variables: [
      {
        key: "candidateName",
        label: "Candidate Name",
        description: "Full name of the candidate",
        example: "John Smith",
      },
      {
        key: "candidateEmail",
        label: "Candidate Email",
        description: "Email address of the candidate",
        example: "john@example.com",
      },
      {
        key: "candidatePhone",
        label: "Candidate Phone",
        description: "Phone number of the candidate",
        example: "+966 50 123 4567",
      },
    ],
  },
  {
    label: "Job Information",
    icon: <Briefcase className="h-4 w-4" />,
    variables: [
      {
        key: "jobTitle",
        label: "Job Title",
        description: "Title of the job position",
        example: "Senior Software Engineer",
      },
      {
        key: "companyName",
        label: "Company Name",
        description: "Name of the hiring company",
        example: "Oracle Technologies",
      },
      {
        key: "department",
        label: "Department",
        description: "Department or team name",
        example: "Engineering",
      },
      {
        key: "location",
        label: "Job Location",
        description: "Location of the job",
        example: "Riyadh, Saudi Arabia",
      },
      {
        key: "salary",
        label: "Salary Range",
        description: "Salary range for the position",
        example: "15,000 - 20,000 SAR",
      },
    ],
  },
  {
    label: "Interview Details",
    icon: <Calendar className="h-4 w-4" />,
    variables: [
      {
        key: "interviewDate",
        label: "Interview Date",
        description: "Date of the interview",
        example: "December 15, 2025",
      },
      {
        key: "interviewTime",
        label: "Interview Time",
        description: "Time of the interview",
        example: "2:00 PM",
      },
      {
        key: "interviewerName",
        label: "Interviewer Name",
        description: "Name of the interviewer",
        example: "Sarah Johnson",
      },
      {
        key: "interviewLocation",
        label: "Interview Location",
        description: "Location or meeting link",
        example: "Conference Room A / Zoom Link",
      },
      {
        key: "interviewDuration",
        label: "Interview Duration",
        description: "Expected duration",
        example: "45 minutes",
      },
    ],
  },
  {
    label: "Application Details",
    icon: <MapPin className="h-4 w-4" />,
    variables: [
      {
        key: "applicationDate",
        label: "Application Date",
        description: "Date when application was submitted",
        example: "December 1, 2025",
      },
      {
        key: "applicationStatus",
        label: "Application Status",
        description: "Current status of the application",
        example: "Under Review",
      },
    ],
  },
];

interface VariablePickerProps {
  onInsert: (variable: string) => void;
}

export function VariablePicker({ onInsert }: VariablePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Code2 className="h-4 w-4 mr-2" />
          Insert Variable
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>Email Variables</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {variableGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <DropdownMenuGroup>
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {group.icon}
                <span>{group.label}</span>
              </div>
              {group.variables.map((variable) => (
                <DropdownMenuItem
                  key={variable.key}
                  onClick={() => onInsert(`{{${variable.key}}}`)}
                  className="flex flex-col items-start py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {`{{${variable.key}}}`}
                    </code>
                    <span className="text-sm font-medium">{variable.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {variable.description}
                  </span>
                  <span className="text-xs text-muted-foreground italic mt-0.5">
                    Example: {variable.example}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {groupIndex < variableGroups.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
