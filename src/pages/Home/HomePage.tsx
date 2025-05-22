import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Plus,
  Trash2,
  Edit3,
  Save,
  Eye,
  ArrowLeft,
} from "lucide-react";

// Type definitions
interface Slide {
  id: number;
  startTime: number;
  title: string;
  type: "text" | "image" | "formula";
  content: string;
  description?: string;
  bgColor: string;
  borderColor: string;
}

interface Lesson {
  id: number;
  title: string;
  ttsText: string;
  totalDuration: number;
  slides: Slide[];
}

interface EditingLesson {
  id: number;
  title: string;
  ttsText: string;
  totalDuration: number;
  slides: Slide[];
}

type ViewType = "database" | "editor" | "preview";
type SlideType = "text" | "image" | "formula";
type ColorTheme =
  | "bg-gray-50"
  | "bg-blue-50"
  | "bg-green-50"
  | "bg-yellow-50"
  | "bg-purple-50"
  | "bg-pink-50";

interface ColorMapping {
  [key: string]: string;
}

interface SlideEditorProps {
  editingLesson: EditingLesson;
  setEditingLesson: React.Dispatch<React.SetStateAction<EditingLesson>>;
  currentSlideIndex: number;
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  saveLesson: () => void;
  addSlide: () => void;
  updateSlide: (slideId: number, updates: Partial<Slide>) => void;
  deleteSlide: (slideId: number) => void;
  formatTime: (time: number) => string;
}

interface LessonDatabaseProps {
  lessons: Lesson[];
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  setCurrentLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  editLesson: (lesson: Lesson) => void;
  deleteLesson: (lessonId: number) => void;
}

interface LessonPreviewProps {
  currentLesson: Lesson | null;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  isPlaying: boolean;
  currentTime: number;
  visibleContent: Slide[];
  togglePlay: () => void;
  resetLesson: () => void;
  formatTime: (time: number) => string;
  ttsSupported: boolean;
}

const LessonManagementSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("database");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [visibleContent, setVisibleContent] = useState<Slide[]>([]);
  const [ttsSupported, setTtsSupported] = useState<boolean>(false);
  const [localEditingLesson, setLocalEditingLesson] = useState<EditingLesson>({
    id: Date.now(),
    title: "",
    ttsText: "",
    totalDuration: 30,
    slides: [],
  });

  // TTS specific state
  const [speechSynthesis, setSpeechSynthesis] =
    useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] =
    useState<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Editor state
  const [editingLesson, setEditingLesson] = useState<EditingLesson>({
    id: Date.now(),
    title: "",
    ttsText: "",
    totalDuration: 30,
    slides: [],
  });
  useEffect(() => {
    setLocalEditingLesson(editingLesson);
  }, [editingLesson]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView === "editor" && e.ctrlKey && e.key === "s") {
        e.preventDefault();
        // Update the main editing lesson with local changes
        setEditingLesson(localEditingLesson);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, localEditingLesson, setEditingLesson]);
  const calculateTTSDuration = useCallback(
    (text: string, wordsPerMinute: number = 150): number => {
      if (!text || text.trim().length === 0) return 0;

      // Count words (split by whitespace and filter out empty strings)
      const wordCount = text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      // Calculate duration in seconds
      const durationInSeconds = Math.ceil((wordCount / wordsPerMinute) * 60);

      // Add a small buffer (10% extra time)
      return Math.ceil(durationInSeconds * 1.1);
    },
    []
  );

  // Color mapping for themes
  const colorMapping: ColorMapping = {
    "bg-gray-50": "border-gray-400",
    "bg-blue-50": "border-blue-400",
    "bg-green-50": "border-green-400",
    "bg-yellow-50": "border-yellow-400",
    "bg-purple-50": "border-purple-400",
    "bg-pink-50": "border-pink-400",
  };

  // Initialize TTS and sample lesson
  useEffect(() => {
    // Check TTS support
    if ("speechSynthesis" in window) {
      setSpeechSynthesis(window.speechSynthesis);
      setTtsSupported(true);
    }

    const sampleLesson: Lesson = {
      id: 1,
      title: "Introduction to Photosynthesis",
      ttsText:
        "Photosynthesis is the process by which plants convert sunlight into energy. This fundamental biological process sustains most life on Earth by producing oxygen and glucose. The chemical equation for photosynthesis is six carbon dioxide plus six water plus light energy equals glucose plus six oxygen.",
      totalDuration: 25,
      slides: [
        {
          id: 1,
          startTime: 0,
          title: "What is Photosynthesis?",
          type: "text",
          content:
            "Photosynthesis is the biological process that converts light energy into chemical energy, enabling plants to produce food.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-400",
        },
        {
          id: 2,
          startTime: 8,
          title: "Chemical Equation",
          type: "formula",
          content: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
          bgColor: "bg-green-50",
          borderColor: "border-green-400",
        },
        {
          id: 3,
          startTime: 16,
          title: "Process Visualization",
          type: "image",
          content:
            "https://via.placeholder.com/600x400/4ade80/ffffff?text=Photosynthesis+Diagram",
          description:
            "Diagram showing the photosynthesis process in plant cells",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-400",
        },
      ],
    };
    setLessons([sampleLesson]);
  }, []);

  // Time tracking for TTS
  useEffect(() => {
    if (isPlaying && currentLesson) {
      const updateTime = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);

        const visible = currentLesson.slides.filter(
          (slide) => elapsed >= slide.startTime
        );
        setVisibleContent(visible);

        // Stop if we've reached the total duration
        if (elapsed >= currentLesson.totalDuration) {
          stopPlayback();
        }
      };

      intervalRef.current = setInterval(updateTime, 100);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPlaying, currentLesson]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesis && currentUtterance) {
        speechSynthesis.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [speechSynthesis, currentUtterance]);

  // TTS Control Functions
  const startTTS = useCallback(
    (text: string): void => {
      if (!speechSynthesis || !text.trim()) return;

      // Cancel any existing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        stopPlayback();
      };

      utterance.onerror = (event) => {
        console.error("TTS Error:", event.error);
        stopPlayback();
      };

      setCurrentUtterance(utterance);
      speechSynthesis.speak(utterance);
    },
    [speechSynthesis]
  );

  const stopPlayback = useCallback((): void => {
    setIsPlaying(false);
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentUtterance(null);
  }, [speechSynthesis]);

  // Lesson Management Functions
  const saveLesson = useCallback((): void => {
    // Calculate suggested duration based on TTS text
    const suggestedDuration = calculateTTSDuration(editingLesson.ttsText);

    // Update the lesson with calculated duration
    const lessonToSave = {
      ...editingLesson,
      totalDuration:
        suggestedDuration > 0 ? suggestedDuration : editingLesson.totalDuration,
    };

    if (isEditing) {
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === editingLesson.id ? (lessonToSave as Lesson) : lesson
        )
      );
    } else {
      const newLesson: Lesson = { ...lessonToSave, id: Date.now() };
      setLessons((prev) => [...prev, newLesson]);
    }

    setIsEditing(false);
    setEditingLesson({
      id: Date.now(),
      title: "",
      ttsText: "",
      totalDuration: 30,
      slides: [],
    });
  }, [calculateTTSDuration, editingLesson, isEditing]);

  const editLesson = useCallback((lesson: Lesson): void => {
    setEditingLesson({ ...lesson });
    setIsEditing(true);
    setCurrentView("editor");
  }, []);

  const deleteLesson = useCallback(
    (lessonId: number): void => {
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
      if (currentLesson && currentLesson.id === lessonId) {
        setCurrentLesson(null);
      }
    },
    [currentLesson]
  );

  // Slide Management Functions
  const addSlide = useCallback((): void => {
    const newSlide: Slide = {
      id: Date.now(),
      startTime: editingLesson.slides.length * 5,
      title: `Slide ${editingLesson.slides.length + 1}`,
      type: "text",
      content: "",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-400",
    };
    setEditingLesson((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setCurrentSlideIndex(editingLesson.slides.length);
  }, [editingLesson.slides.length]);

  const updateSlide = useCallback(
    (slideId: number, updates: Partial<Slide>): void => {
      setEditingLesson((prev) => ({
        ...prev,
        slides: prev.slides.map((slide) =>
          slide.id === slideId ? { ...slide, ...updates } : slide
        ),
      }));
    },
    []
  );

  const deleteSlide = useCallback(
    (slideId: number): void => {
      setEditingLesson((prev) => ({
        ...prev,
        slides: prev.slides.filter((slide) => slide.id !== slideId),
      }));
      if (currentSlideIndex >= editingLesson.slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, editingLesson.slides.length - 2));
      }
    },
    [currentSlideIndex, editingLesson.slides.length]
  );

  // Audio Controls
  const togglePlay = useCallback((): void => {
    if (!currentLesson) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      setIsPlaying(true);
      startTimeRef.current = Date.now() - currentTime * 1000;

      if (ttsSupported && currentLesson.ttsText) {
        startTTS(currentLesson.ttsText);
      }
    }
  }, [
    currentLesson,
    isPlaying,
    currentTime,
    ttsSupported,
    startTTS,
    stopPlayback,
  ]);

  const resetLesson = useCallback((): void => {
    stopPlayback();
    setCurrentTime(0);
    setVisibleContent([]);
    startTimeRef.current = 0;
  }, [stopPlayback]);

  const formatTime = useCallback((time: number): string => {
    const minutes: number = Math.floor(time / 60);
    const seconds: number = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Auto-update duration when TTS text changes
  useEffect(() => {
    if (editingLesson.ttsText) {
      const suggestedDuration = calculateTTSDuration(editingLesson.ttsText);
      // Only auto-update if current duration is the default (30s) or very different
      if (
        editingLesson.totalDuration === 30 ||
        Math.abs(editingLesson.totalDuration - suggestedDuration) >
          suggestedDuration * 0.5
      ) {
        setEditingLesson((prev) => ({
          ...prev,
          totalDuration: suggestedDuration,
        }));
      }
    }
  }, [
    editingLesson.ttsText,
    editingLesson.totalDuration,
    calculateTTSDuration,
  ]);

  // Component Renders
  const LessonDatabase: React.FC<LessonDatabaseProps> = ({
    lessons,
    setCurrentView,
    setCurrentLesson,
    editLesson,
    deleteLesson,
  }) => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">List Course</h2>
        <button
          onClick={() => setCurrentView("editor")}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          <span>New Course</span>
        </button>
      </div>

      {!ttsSupported && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <strong>Note:</strong> Text-to-speech is not supported in your
          browser. Audio functionality will be limited.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson: Lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-lg shadow-md p-6 border"
          >
            <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {lesson.ttsText.substring(0, 100)}...
            </p>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>{lesson.slides.length} slides</span>
              <span>{lesson.totalDuration}s</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setCurrentLesson(lesson);
                  setCurrentView("preview");
                }}
                className="flex-1 flex items-center justify-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
              <button
                onClick={() => editLesson(lesson)}
                className="flex-1 flex items-center justify-center space-x-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => deleteLesson(lesson.id)}
                className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const SlideEditor: React.FC<SlideEditorProps> = ({
    editingLesson,
    setEditingLesson,
    currentSlideIndex,
    setCurrentSlideIndex,
    setCurrentView,
    saveLesson,
    formatTime,
  }) => {
    // Local state that only updates when explicitly saved
    const [localEditingLesson, setLocalEditingLesson] =
      useState<EditingLesson>(editingLesson);

    // Update local state when editing lesson changes (from outside)
    useEffect(() => {
      setLocalEditingLesson(editingLesson);
    }, [editingLesson]);

    // Stable reference to current slide from local state
    const currentSlide: Slide | undefined =
      localEditingLesson.slides[currentSlideIndex];

    // Local update handlers that modify local state only
    const handleLessonUpdate = useCallback(
      (field: keyof EditingLesson, value: string | number): void => {
        setLocalEditingLesson((prev: EditingLesson) => ({
          ...prev,
          [field]: value,
        }));
      },
      []
    );

    const handleLocalSlideUpdate = useCallback(
      (slideId: number, updates: Partial<Slide>): void => {
        setLocalEditingLesson((prev: EditingLesson) => ({
          ...prev,
          slides: prev.slides.map((slide) =>
            slide.id === slideId ? { ...slide, ...updates } : slide
          ),
        }));
      },
      []
    );

    const handleSlideTypeChange = useCallback(
      (slideId: number, newType: SlideType): void => {
        handleLocalSlideUpdate(slideId, {
          type: newType,
          content:
            newType === "image"
              ? "https://via.placeholder.com/600x400/4ade80/ffffff?text=Image+Placeholder"
              : "",
        });
      },
      [handleLocalSlideUpdate]
    );

    const handleColorChange = useCallback(
      (slideId: number, bgColor: ColorTheme): void => {
        const borderColor = colorMapping[bgColor] || "border-gray-400";
        handleLocalSlideUpdate(slideId, { bgColor, borderColor });
      },
      [handleLocalSlideUpdate]
    );

    const handleLocalAddSlide = useCallback((): void => {
      const newSlide: Slide = {
        id: Date.now(),
        startTime: localEditingLesson.slides.length * 5,
        title: `Slide ${localEditingLesson.slides.length + 1}`,
        type: "text",
        content: "",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-400",
      };
      setLocalEditingLesson((prev: EditingLesson) => ({
        ...prev,
        slides: [...prev.slides, newSlide],
      }));
      setCurrentSlideIndex(localEditingLesson.slides.length);
    }, [localEditingLesson.slides.length, setCurrentSlideIndex]);

    const handleLocalDeleteSlide = useCallback(
      (slideId: number): void => {
        setLocalEditingLesson((prev: EditingLesson) => ({
          ...prev,
          slides: prev.slides.filter((slide) => slide.id !== slideId),
        }));
        if (currentSlideIndex >= localEditingLesson.slides.length - 1) {
          setCurrentSlideIndex(
            Math.max(0, localEditingLesson.slides.length - 2)
          );
        }
      },
      [
        currentSlideIndex,
        localEditingLesson.slides.length,
        setCurrentSlideIndex,
      ]
    );

    // Apply changes to parent state (only when explicitly called)
    const applyChanges = useCallback((): void => {
      setEditingLesson(localEditingLesson);
    }, [localEditingLesson, setEditingLesson]);

    // Keyboard shortcut handler
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          applyChanges();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [applyChanges]);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
      return (
        JSON.stringify(editingLesson) !== JSON.stringify(localEditingLesson)
      );
    }, [editingLesson, localEditingLesson]);

    return (
      <div className="flex h-screen">
        {/* Slide Navigation */}
        <div className="w-64 bg-gray-100 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <button
              onClick={handleLocalAddSlide}
              className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              <Plus size={20} />
              <span>Add Slide</span>
            </button>
          </div>

          <div className="p-2">
            {localEditingLesson.slides.map((slide: Slide, index: number) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                className={`p-3 mb-2 rounded cursor-pointer border-2 ${
                  index === currentSlideIndex
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-sm">{slide.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(slide.startTime)} - {slide.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView("database")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={20} />
                <span>Back to Database</span>
              </button>
              <span className="text-gray-400">|</span>
              <span className="font-medium">
                {localEditingLesson.title || "Untitled Lesson"}
                {hasUnsavedChanges && (
                  <span className="text-orange-500 ml-1">*</span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                  <span>Unsaved changes</span>
                  <kbd className="px-2 py-1 bg-white border rounded text-xs">
                    Ctrl+S
                  </kbd>
                </div>
              )}
              <button
                onClick={applyChanges}
                disabled={!hasUnsavedChanges}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  hasUnsavedChanges
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Save size={20} />
                <span>Apply Changes</span>
              </button>
              <button
                onClick={() => {
                  setCurrentLesson({ ...localEditingLesson } as Lesson);
                  setCurrentView("preview");
                }}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                <Eye size={20} />
                <span>Preview</span>
              </button>
              <button
                onClick={saveLesson}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                <Save size={20} />
                <span>Save Lesson</span>
              </button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex">
            {/* Slide Preview */}
            <div className="w-1/2 p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Slide Preview</h3>
              {currentSlide ? (
                <div
                  className={`${currentSlide.bgColor} border-l-4 ${currentSlide.borderColor} p-6 rounded-lg`}
                >
                  <h4 className="text-xl font-semibold mb-3">
                    {currentSlide.title}
                  </h4>
                  {currentSlide.type === "image" ? (
                    <div>
                      <img
                        src={currentSlide.content}
                        alt={currentSlide.description || "Slide image"}
                        className="max-w-full h-auto rounded-lg mb-2"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement>
                        ) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="%23f3f4f6"/><text x="200" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="%236b7280">Image Preview</text></svg>';
                        }}
                      />
                      <p className="text-sm text-gray-600">
                        {currentSlide.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-700">{currentSlide.content}</p>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-20">
                  <Plus size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Add a slide to get started</p>
                </div>
              )}
            </div>

            {/* Properties Panel */}
            <div className="w-1/2 p-6 bg-white overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Properties</h3>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Press Ctrl+S to apply changes
                </div>
              </div>

              {/* Lesson Properties */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Lesson Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={localEditingLesson.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleLessonUpdate("title", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Lesson title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      TTS Text
                    </label>
                    <textarea
                      value={localEditingLesson.ttsText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleLessonUpdate("ttsText", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg h-24"
                      placeholder="Enter the text that will be spoken..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Duration (seconds)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={localEditingLesson.totalDuration}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleLessonUpdate(
                            "totalDuration",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = calculateTTSDuration(
                            localEditingLesson.ttsText
                          );
                          if (suggested > 0) {
                            handleLessonUpdate("totalDuration", suggested);
                          }
                        }}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                        title="Calculate suggested duration based on TTS text"
                      >
                        Auto
                      </button>
                    </div>
                    {localEditingLesson.ttsText && (
                      <div className="mt-1 text-xs text-gray-600">
                        Suggested:{" "}
                        {calculateTTSDuration(localEditingLesson.ttsText)}s (
                        {Math.ceil(
                          localEditingLesson.ttsText.trim().split(/\s+/).length
                        )}{" "}
                        words)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Slide Properties */}
              {currentSlide && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Slide Properties</h4>
                    <button
                      onClick={() => handleLocalDeleteSlide(currentSlide.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={currentSlide.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleLocalSlideUpdate(currentSlide.id, {
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Start Time (seconds)
                      </label>
                      <input
                        type="number"
                        value={currentSlide.startTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleLocalSlideUpdate(currentSlide.id, {
                            startTime: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Type
                      </label>
                      <select
                        value={currentSlide.type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleSlideTypeChange(
                            currentSlide.id,
                            e.target.value as SlideType
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="formula">Formula</option>
                      </select>
                    </div>

                    {currentSlide.type === "image" ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Image URL
                          </label>
                          <input
                            type="url"
                            value={currentSlide.content}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              handleLocalSlideUpdate(currentSlide.id, {
                                content: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={currentSlide.description || ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              handleLocalSlideUpdate(currentSlide.id, {
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Image description"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Content
                        </label>
                        <textarea
                          value={currentSlide.content}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>
                          ) =>
                            handleLocalSlideUpdate(currentSlide.id, {
                              content: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg h-24"
                          placeholder="Enter slide content..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Background Color
                      </label>
                      <select
                        value={currentSlide.bgColor}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleColorChange(
                            currentSlide.id,
                            e.target.value as ColorTheme
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="bg-gray-50">Gray</option>
                        <option value="bg-blue-50">Blue</option>
                        <option value="bg-green-50">Green</option>
                        <option value="bg-yellow-50">Yellow</option>
                        <option value="bg-purple-50">Purple</option>
                        <option value="bg-pink-50">Pink</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const LessonPreview: React.FC<LessonPreviewProps> = ({
    currentLesson,
    setCurrentView,
    isPlaying,
    currentTime,
    visibleContent,
    togglePlay,
    resetLesson,
    formatTime,
    ttsSupported,
  }) => {
    // Prevent rendering if no lesson is selected
    if (!currentLesson) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-semibold mb-4">No Lesson Selected</h2>
            <button
              onClick={() => setCurrentView("database")}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mx-auto"
            >
              <ArrowLeft size={20} />
              <span>Back to Database</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
          <button
            onClick={() => {
              resetLesson();
              setCurrentView("database");
            }}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <h1 className="text-xl font-semibold text-center flex-1">
            {currentLesson.title}
          </h1>

          <div className="text-sm text-gray-400">
            {currentLesson.slides.length} slides
          </div>
        </div>

        {/* TTS Warning */}
        {!ttsSupported && (
          <div className="mx-4 mt-2 bg-yellow-900/50 border border-yellow-600 text-yellow-200 px-4 py-2 rounded text-sm">
            Text-to-speech not supported. Audio functionality limited.
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-4xl w-full">
            {!isPlaying && currentTime === 0 && (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">🎧</div>
                <h2 className="text-3xl font-semibold mb-4">Ready to Start?</h2>
                <p className="text-gray-300 text-lg mb-6 max-w-md mx-auto">
                  Click play to begin the lesson. Content will appear as the
                  audio progresses.
                </p>
                <div className="text-gray-400">
                  {currentLesson.slides.length} slides •{" "}
                  {formatTime(currentLesson.totalDuration)}
                </div>
              </div>
            )}

            {visibleContent.length > 0 && (
              <div className="space-y-8">
                {visibleContent.map((slide) => {
                  const isActive = currentTime >= slide.startTime;

                  return (
                    <div
                      key={`${slide.id}-${slide.startTime}`}
                      className={`transition-all duration-500 ease-out ${
                        isActive
                          ? "opacity-100 transform translate-y-0 scale-100"
                          : "opacity-30 transform translate-y-2 scale-98"
                      }`}
                    >
                      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="text-2xl font-semibold text-white">
                            {slide.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                              {formatTime(slide.startTime)}
                            </span>
                            {isActive && (
                              <span className="text-xs text-green-400 bg-green-900/50 px-3 py-1 rounded-full border border-green-700">
                                Playing
                              </span>
                            )}
                          </div>
                        </div>

                        {slide.type === "image" ? (
                          <div className="text-center">
                            <div className="relative min-h-[300px] flex items-center justify-center">
                              <img
                                src={slide.content}
                                alt={slide.description || slide.title}
                                className="max-w-full h-auto rounded-lg shadow-2xl mx-auto opacity-0 transition-opacity duration-300"
                                style={{ maxHeight: "60vh" }}
                                onLoad={(
                                  e: React.SyntheticEvent<HTMLImageElement>
                                ) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.opacity = "1";
                                }}
                                onError={(
                                  e: React.SyntheticEvent<HTMLImageElement>
                                ) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="%23374151" stroke="%236b7280"/><text x="300" y="150" text-anchor="middle" font-family="Arial" font-size="18" fill="%239ca3af">Image not available</text></svg>';
                                  target.style.opacity = "1";
                                }}
                              />
                            </div>
                            {slide.description && (
                              <p className="text-gray-300 mt-4 text-lg italic">
                                {slide.description}
                              </p>
                            )}
                          </div>
                        ) : slide.type === "formula" ? (
                          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <code className="text-xl font-mono text-blue-300 block text-center">
                              {slide.content}
                            </code>
                          </div>
                        ) : (
                          <div className="text-gray-100 text-xl leading-relaxed">
                            {slide.content}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isPlaying && visibleContent.length === 0 && currentTime > 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">⏳</div>
                <h2 className="text-2xl font-semibold mb-4">
                  Lesson in Progress...
                </h2>
                <p className="text-gray-300 text-lg">
                  Waiting for the first slide at{" "}
                  {formatTime(currentLesson.slides[0]?.startTime || 0)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Video Player Controls - Fixed at Bottom */}
        <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (currentTime / currentLesson.totalDuration) * 100
                    )
                  )}%`,
                }}
              ></div>
            </div>

            {/* Slide markers */}
            <div className="flex justify-between text-xs text-gray-400">
              {currentLesson.slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`px-2 py-1 rounded text-xs ${
                    currentTime >= slide.startTime
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {formatTime(slide.startTime)}
                </div>
              ))}
            </div>
          </div>

          {/* Control Buttons and Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <button
                onClick={resetLesson}
                className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
              >
                <RotateCcw size={18} />
              </button>

              <div className="flex items-center space-x-2 text-gray-300">
                <Volume2 size={18} />
                <span className="text-sm font-mono">
                  {formatTime(Math.max(0, currentTime))} /{" "}
                  {formatTime(currentLesson.totalDuration)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {visibleContent.length} of {currentLesson.slides.length} slides
                visible
              </div>

              {/* TTS Script Toggle */}
              {currentLesson.ttsText && (
                <div className="max-w-xs">
                  <details className="group">
                    <summary className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                      <Volume2 size={16} />
                      <span>Script</span>
                    </summary>
                    <div className="absolute bottom-full right-4 mb-2 bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md shadow-xl">
                      <p className="text-sm text-gray-200 italic leading-relaxed">
                        "{currentLesson.ttsText}"
                      </p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {currentView === "database" && (
        <LessonDatabase
          lessons={lessons}
          setCurrentView={setCurrentView}
          setCurrentLesson={setCurrentLesson}
          editLesson={editLesson}
          deleteLesson={deleteLesson}
        />
      )}
      {currentView === "editor" && (
        <SlideEditor
          editingLesson={editingLesson}
          setEditingLesson={setEditingLesson}
          currentSlideIndex={currentSlideIndex}
          setCurrentSlideIndex={setCurrentSlideIndex}
          setCurrentView={setCurrentView}
          saveLesson={saveLesson}
          addSlide={addSlide}
          updateSlide={updateSlide}
          deleteSlide={deleteSlide}
          formatTime={formatTime}
        />
      )}
      {currentView === "preview" && currentLesson && (
        <LessonPreview
          currentLesson={currentLesson}
          setCurrentView={setCurrentView}
          isPlaying={isPlaying}
          currentTime={currentTime}
          visibleContent={visibleContent}
          togglePlay={togglePlay}
          resetLesson={resetLesson}
          formatTime={formatTime}
          ttsSupported={ttsSupported}
        />
      )}
    </div>
  );
};

export default LessonManagementSystem;
