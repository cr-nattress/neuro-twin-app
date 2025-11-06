"use client";

import { Persona } from "@/types/persona";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Download, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

interface PersonaReviewProps {
  persona: Persona;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
}

/**
 * Helper to safely filter and render array items, excluding null/undefined values
 */
function filterNullItems<T>(items: (T | null | undefined)[]): T[] {
  return items.filter((item): item is T => item != null && item !== "");
}

export function PersonaReview({
  persona,
  onSave,
  onBack,
  isSaving,
}: PersonaReviewProps) {
  const handleExport = () => {
    const dataStr = JSON.stringify(persona, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    const safeFileName = persona.name
      ? persona.name.toLowerCase().replace(/\s+/g, "-")
      : "persona";
    link.download = `persona-${safeFileName}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Edit
        </Button>
        <div className="flex gap-2">
          {persona.id && (
            <Link href={`/chat?persona_id=${persona.id}`}>
              <Button variant="default" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat with Persona
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Persona"}
          </Button>
        </div>
      </div>

      {/* Main Persona Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {persona.name ? persona.name : "Unnamed Persona"}
          </CardTitle>
          <CardDescription>
            {typeof persona.age === "number" && persona.age > 0 && (
              <>
                {persona.age} years old
                {persona.occupation ? " • " : ""}
              </>
            )}
            {persona.occupation && persona.occupation}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background */}
          {persona.background && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Background</h3>
              <p className="text-sm text-muted-foreground">
                {persona.background}
              </p>
            </div>
          )}

          {/* Traits */}
          {Array.isArray(persona.traits) && filterNullItems(persona.traits).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Personality Traits</h3>
              <div className="flex flex-wrap gap-2">
                {filterNullItems(persona.traits).map((trait, index) => (
                  <Badge key={index} variant="secondary">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {Array.isArray(persona.interests) && filterNullItems(persona.interests).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {filterNullItems(persona.interests).map((interest, index) => (
                  <Badge key={index} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {Array.isArray(persona.skills) && filterNullItems(persona.skills).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {filterNullItems(persona.skills).map((skill, index) => (
                  <Badge key={index}>{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          {Array.isArray(persona.values) && filterNullItems(persona.values).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Core Values</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {filterNullItems(persona.values).map((value, index) => (
                  <li key={index}>{value}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Communication Style */}
          {persona.communication_style && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Communication Style</h3>
              <p className="text-sm text-muted-foreground">
                {persona.communication_style}
              </p>
            </div>
          )}

          {/* Personality Type */}
          {persona.personality_type && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Personality Type</h3>
              <p className="text-sm text-muted-foreground">
                {persona.personality_type}
              </p>
            </div>
          )}

          {/* Goals */}
          {Array.isArray(persona.goals) && filterNullItems(persona.goals).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Goals</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {filterNullItems(persona.goals).map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges */}
          {Array.isArray(persona.challenges) && filterNullItems(persona.challenges).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Challenges</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {filterNullItems(persona.challenges).map((challenge, index) => (
                  <li key={index}>{challenge}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          {persona.metadata && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-2">Source Data</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {typeof persona.metadata.source_text_blocks === "number" && (
                  <p>
                    {persona.metadata.source_text_blocks} text block
                    {persona.metadata.source_text_blocks !== 1 ? "s" : ""}
                  </p>
                )}
                {typeof persona.metadata.source_links === "number" && (
                  <p>
                    {persona.metadata.source_links} link
                    {persona.metadata.source_links !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
