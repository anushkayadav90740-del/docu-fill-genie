import { Navigation } from "@/components/Navigation";
import { DocumentForm } from "@/components/DocumentForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <DocumentForm />
      </main>
    </div>
  );
};

export default Index;
