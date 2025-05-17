import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RefreshCw } from "lucide-react";

interface MemberLevelPhotosProps {
  memberId: string;
  name: string;
}

export default function MemberLevelPhotos({
  memberId,
  name,
}: MemberLevelPhotosProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [seeds, setSeeds] = useState<Record<number, string>>({});

  // Generate level tabs from 1 to 10
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    // Load saved seeds from localStorage
    const storedSeeds = localStorage.getItem(
      `familyTask_levelSeeds_${memberId}`,
    );
    if (storedSeeds) {
      setSeeds(JSON.parse(storedSeeds));
    } else {
      // Initialize with default seeds
      const defaultSeeds = levels.reduce(
        (acc, level) => {
          acc[level] = `${name}-level${level}`;
          return acc;
        },
        {} as Record<number, string>,
      );

      setSeeds(defaultSeeds);
      localStorage.setItem(
        `familyTask_levelSeeds_${memberId}`,
        JSON.stringify(defaultSeeds),
      );
    }
  }, [memberId, name]);

  const regenerateAvatar = () => {
    const newSeed = `${name}-level${selectedLevel}-${Math.random().toString(36).substring(2, 8)}`;
    const updatedSeeds = { ...seeds, [selectedLevel]: newSeed };

    setSeeds(updatedSeeds);
    localStorage.setItem(
      `familyTask_levelSeeds_${memberId}`,
      JSON.stringify(updatedSeeds),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Photos for {name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="1"
          onValueChange={(value) => setSelectedLevel(parseInt(value))}
        >
          <TabsList className="grid grid-cols-5 mb-4">
            {levels.slice(0, 5).map((level) => (
              <TabsTrigger key={level} value={level.toString()}>
                Level {level}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="grid grid-cols-5 mb-6">
            {levels.slice(5, 10).map((level) => (
              <TabsTrigger key={level} value={level.toString()}>
                Level {level}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map((level) => (
            <TabsContent
              key={level}
              value={level.toString()}
              className="flex flex-col items-center"
            >
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold">Level {level} Avatar</h3>
                <p className="text-sm text-muted-foreground">
                  This avatar will be shown when {name} reaches level {level}
                </p>
              </div>

              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seeds[level] || `${name}-level${level}`}`}
                />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>

              <Button
                onClick={regenerateAvatar}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Generate New Avatar
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
