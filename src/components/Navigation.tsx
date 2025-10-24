import { Link, useLocation } from "react-router-dom";
import { FileText, List } from "lucide-react";
import { Button } from "./ui/button";

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">DocuGen</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              asChild
              size="sm"
            >
              <Link to="/">
                <FileText className="mr-2 h-4 w-4" />
                New Form
              </Link>
            </Button>
            <Button
              variant={location.pathname === "/submissions" ? "default" : "ghost"}
              asChild
              size="sm"
            >
              <Link to="/submissions">
                <List className="mr-2 h-4 w-4" />
                Submissions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
