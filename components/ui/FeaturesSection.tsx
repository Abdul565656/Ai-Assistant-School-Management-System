// components/landing/FeaturesSection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Edit3, MessageCircle, Users, Brain, BarChart3 } from "lucide-react";

const features = [
  {
    icon: <Edit3 className="h-8 w-8 text-primary" />,
    title: "AI Assignment Creation",
    description: "Teachers can generate diverse assignments with AI assistance, saving valuable preparation time.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Smart AI Grading",
    description: "Get AI-suggested feedback and scores for student submissions, streamlining the grading process.",
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-primary" />,
    title: "Personalized AI Tutor",
    description: "Students can ask questions and get 'Explain Like I’m 5' explanations from their AI tutor.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Role-Based Dashboards",
    description: "Dedicated dashboards for teachers and students with tools tailored to their needs.",
  },
  {
    icon: <Brain className="h-8 w-8 text-primary" />,
    title: "AI Teaching Assistance",
    description: "Teachers can ask AI for help explaining complex topics or generating teaching ideas.",
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: "Progress Tracking",
    description: "Monitor student submissions and performance with clear, actionable insights (Coming Soon).",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need, Powered by AI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover how our intelligent features can transform the educational experience for everyone.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}