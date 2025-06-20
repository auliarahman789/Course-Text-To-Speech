import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Type,
  Image,
  HelpCircle,
  Layout,
  Check,
  X,
  Play,
  Download,
  Volume2, // Add this
  VolumeX, // Add this
  Pause,
} from "lucide-react";

const HomePage = () => {
  const [isSpeaking, setIsSpeaking] = useState<any>(false);
  const [isPaused, setIsPaused] = useState<any>(false);
  const [speechRate, setSpeechRate] = useState<any>(1);
  const [speechVoice, setSpeechVoice] = useState<any>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  const [slides, setSlides] = useState<any>([
    {
      id: 1,
      type: "basic",
      elements: [
        {
          id: "title-1",
          type: "text",
          content: "Welcome to Canvas PowerPoint",
          x: 100,
          y: 100,
          width: 600,
          height: 80,
          fontSize: 48,
          fontWeight: "bold",
          color: "#1f2937",
        },
        {
          id: "content-1",
          type: "text",
          content: "Now with Quiz slides! Try adding one.",
          x: 100,
          y: 200,
          width: 500,
          height: 60,
          fontSize: 24,
          fontWeight: "normal",
          color: "#6b7280",
        },
      ],
    },
  ]);
  const initializeTTS = () => {
    if ("speechSynthesis" in window) {
      const voices: any = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !speechVoice) {
        setSpeechVoice(voices[0]);
      }
    }
  };
  const speakSlideContent = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser");
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    let textToSpeak = "";

    if (currentSlideData.type === "basic") {
      // For basic slides, read all text elements
      currentSlideData.elements?.forEach((element: any) => {
        if (element.type === "text") {
          textToSpeak += element.content + ". ";
        }
      });
    } else if (currentSlideData.type === "quiz") {
      // For quiz slides, read question and choices
      textToSpeak = `Quiz Question: ${currentSlideData.question}. `;
      currentSlideData.choices.forEach((choice: any, index: any) => {
        textToSpeak += `Option ${String.fromCharCode(65 + index)}: ${
          choice.text
        }. `;
      });
    }

    if (textToSpeak.trim()) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = speechRate;
      utterance.voice = speechVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      speechSynthesis.speak(utterance);
    }
  };

  const pauseResumeSpeech = () => {
    if (speechSynthesis.speaking) {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };
  const [currentSlide, setCurrentSlide] = useState<any>(0);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<any>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<any>("");
  const [showSlideTypeModal, setShowSlideTypeModal] = useState<any>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<any>(false);
  const [quizAnswers, setQuizAnswers] = useState<any>({});
  const [showQuizResults, setShowQuizResults] = useState<any>(false);
  const canvasRef = useRef<any>(null);
  const fileInputRef = useRef<any>(null);

  const addSlide: any = (slideType = "basic") => {
    let newSlide: any;

    if (slideType === "basic") {
      newSlide = {
        id: Date.now(),
        type: "basic",
        elements: [
          {
            id: `title-${Date.now()}`,
            type: "text",
            content: "New Slide Title",
            x: 100,
            y: 100,
            width: 500,
            height: 80,
            fontSize: 36,
            fontWeight: "bold",
            color: "#1f2937",
          },
        ],
      };
    } else {
      newSlide = {
        id: Date.now(),
        type: "quiz",
        question: "Enter your question here",
        choices: [
          { id: 1, text: "Option A", isCorrect: true },
          { id: 2, text: "Option B", isCorrect: false },
          { id: 3, text: "Option C", isCorrect: false },
          { id: 4, text: "Option D", isCorrect: false },
        ],
        explanation: "Explain why this is the correct answer",
      };
    }

    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
    setShowSlideTypeModal(false);
  };

  const deleteSlide = () => {
    if (slides.length > 1) {
      const newSlides = slides.filter(
        (_: any, index: any) => index !== currentSlide
      );
      setSlides(newSlides);
      setCurrentSlide(Math.max(0, currentSlide - 1));
    }
  };

  const addTextElement = () => {
    if (slides[currentSlide].type !== "basic") return;

    const newElement = {
      id: `text-${Date.now()}`,
      type: "text",
      content: "Click to edit text",
      x: 200,
      y: 300,
      width: 300,
      height: 50,
      fontSize: 18,
      fontWeight: "normal",
      color: "#374151",
    };

    const updatedSlides = [...slides];
    updatedSlides[currentSlide].elements.push(newElement);
    setSlides(updatedSlides);
    setSelectedElement(newElement.id);
  };

  const addImageElement = () => {
    if (slides[currentSlide].type !== "basic") return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: any) => {
    const file: any = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader: any = new FileReader();
      reader.onload = (event: any) => {
        const newElement: any = {
          id: `image-${Date.now()}`,
          type: "image",
          src: event.target.result,
          x: 200,
          y: 200,
          width: 300,
          height: 200,
        };

        const updatedSlides = [...slides];
        updatedSlides[currentSlide].elements.push(newElement);
        setSlides(updatedSlides);
        setSelectedElement(newElement.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const addChoice = () => {
    const updatedSlides = [...slides];
    const newChoiceId =
      Math.max(...updatedSlides[currentSlide].choices.map((c: any) => c.id)) +
      1;
    updatedSlides[currentSlide].choices.push({
      id: newChoiceId,
      text: `Option ${String.fromCharCode(64 + newChoiceId)}`,
      isCorrect: false,
    });
    setSlides(updatedSlides);
  };

  const removeChoice = (choiceId: any) => {
    const updatedSlides = [...slides];
    if (updatedSlides[currentSlide].choices.length > 2) {
      updatedSlides[currentSlide].choices = updatedSlides[
        currentSlide
      ].choices.filter((c: any) => c.id !== choiceId);
      setSlides(updatedSlides);
    }
  };

  const updateQuizSlide = (field: any, value: any) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlide][field] = value;
    setSlides(updatedSlides);
  };

  const updateChoice = (choiceId: any, field: any, value: any) => {
    const updatedSlides = [...slides];
    const choiceIndex = updatedSlides[currentSlide].choices.findIndex(
      (c: any) => c.id === choiceId
    );
    if (choiceIndex !== -1) {
      if (field === "isCorrect" && value) {
        // Only one correct answer allowed
        updatedSlides[currentSlide].choices.forEach(
          (c: any) => (c.isCorrect = false)
        );
      }
      updatedSlides[currentSlide].choices[choiceIndex][field] = value;
      setSlides(updatedSlides);
    }
  };

  const deleteElement = () => {
    if (selectedElement && slides[currentSlide].type === "basic") {
      const updatedSlides = [...slides];
      updatedSlides[currentSlide].elements = updatedSlides[
        currentSlide
      ].elements.filter((el: any) => el.id !== selectedElement);
      setSlides(updatedSlides);
      setSelectedElement(null);
    }
  };

  const updateElement = useCallback(
    (elementId: any, updates: any) => {
      setSlides((prevSlides: any) => {
        const updatedSlides = [...prevSlides];
        const elementIndex = updatedSlides[currentSlide].elements.findIndex(
          (el: any) => el.id === elementId
        );
        if (elementIndex !== -1) {
          updatedSlides[currentSlide].elements[elementIndex] = {
            ...updatedSlides[currentSlide].elements[elementIndex],
            ...updates,
          };
        }
        return updatedSlides;
      });
    },
    [currentSlide]
  );

  const handleMouseDown = (e: any, elementId: any) => {
    if (slides[currentSlide].type !== "basic" || isPresentationMode) return;

    e.preventDefault();
    e.stopPropagation(); // Add this
    setSelectedElement(elementId);

    const rect = canvasRef.current.getBoundingClientRect();
    const element = slides[currentSlide].elements.find(
      (el: any) => el.id === elementId
    );

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on resize handle
    const handles = getResizeHandles(element);
    const clickedHandle = handles.find(
      (handle) =>
        mouseX >= handle.x - 5 &&
        mouseX <= handle.x + 5 &&
        mouseY >= handle.y - 5 &&
        mouseY <= handle.y + 5
    );

    if (clickedHandle) {
      setIsResizing(true);
      setResizeHandle(clickedHandle.type);
      setDragStart({ x: mouseX, y: mouseY });
    } else {
      setIsDragging(true);
      setDragStart({
        x: mouseX - element.x,
        y: mouseY - element.y,
      });
    }
  };

  const handleMouseMove = (e: any) => {
    if (
      !selectedElement ||
      (!isDragging && !isResizing) ||
      slides[currentSlide].type !== "basic" ||
      isPresentationMode
    )
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const element = slides[currentSlide].elements.find(
      (el: any) => el.id === selectedElement
    );

    if (isDragging) {
      updateElement(selectedElement, {
        x: Math.max(0, mouseX - dragStart.x),
        y: Math.max(0, mouseY - dragStart.y),
      });
    } else if (isResizing) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      let updates = {};

      switch (resizeHandle) {
        case "se":
          updates = {
            width: Math.max(50, element.width + deltaX),
            height: Math.max(30, element.height + deltaY),
          };
          break;
        case "sw":
          updates = {
            x: element.x + deltaX,
            width: Math.max(50, element.width - deltaX),
            height: Math.max(30, element.height + deltaY),
          };
          break;
        case "ne":
          updates = {
            y: element.y + deltaY,
            width: Math.max(50, element.width + deltaX),
            height: Math.max(30, element.height - deltaY),
          };
          break;
        case "nw":
          updates = {
            x: element.x + deltaX,
            y: element.y + deltaY,
            width: Math.max(50, element.width - deltaX),
            height: Math.max(30, element.height - deltaY),
          };
          break;
      }

      updateElement(selectedElement, updates);
      setDragStart({ x: mouseX, y: mouseY });
    }
  };
  useEffect(() => {
    initializeTTS();

    // Some browsers load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = initializeTTS;
    }
  }, []);

  // Stop speech when slide changes
  useEffect(() => {
    stopSpeech();
  }, [currentSlide]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  };

  const getResizeHandles = (element: any) => {
    if (!element) return [];

    return [
      { type: "nw", x: element.x, y: element.y },
      { type: "ne", x: element.x + element.width, y: element.y },
      { type: "sw", x: element.x, y: element.y + element.height },
      {
        type: "se",
        x: element.x + element.width,
        y: element.y + element.height,
      },
    ];
  };

  const handleTextEdit = (elementId: any, newContent: any) => {
    updateElement(elementId, { content: newContent });
  };

  const nextSlide = () =>
    setCurrentSlide((prev: any) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev: any) => (prev - 1 + slides.length) % slides.length);

  const handleQuizAnswer = (slideId: any, choiceId: any) => {
    setQuizAnswers((prev: any) => ({
      ...prev,
      [slideId]: choiceId,
    }));
  };

  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
    setSelectedElement(null);
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  const exportPresentation = () => {
    const dataStr = JSON.stringify(slides, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "presentation.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (isPresentationMode) {
        if (e.key === "ArrowRight" || e.key === " ") nextSlide();
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "Escape") togglePresentationMode();
        return;
      }

      if (
        e.key === "Delete" &&
        selectedElement &&
        slides[currentSlide].type === "basic"
      ) {
        deleteElement();
      }
      if (e.key === "Escape") {
        setSelectedElement(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElement, currentSlide, isPresentationMode]);

  const currentSlideData = slides[currentSlide];
  const selectedElementData = useMemo(() => {
    if (
      !selectedElement ||
      currentSlideData.type !== "basic" ||
      !currentSlideData.elements
    ) {
      return null;
    }
    return (
      currentSlideData.elements.find((el: any) => el.id === selectedElement) ||
      null
    );
  }, [selectedElement, currentSlideData.elements]);
  const renderBasicSlide = () => (
    <div
      ref={canvasRef}
      className={`w-[900px] h-[600px] bg-white rounded-lg shadow-lg relative overflow-hidden ${
        isPresentationMode ? "cursor-default" : "cursor-crosshair"
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        // Only clear selection if clicking on the canvas itself, not child elements
        if (!isPresentationMode && e.target === e.currentTarget) {
          setSelectedElement(null);
        }
      }}
    >
      {currentSlideData.elements?.map((element: any) => (
        <div key={element.id}>
          {element.type === "text" ? (
            <div
              className={`absolute select-none ${
                isPresentationMode ? "cursor-default" : "cursor-move"
              } ${
                selectedElement === element.id && !isPresentationMode
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                fontSize: element.fontSize,
                fontWeight: element.fontWeight,
                color: element.color,
                padding: "8px",
              }}
              onMouseDown={(e) =>
                !isPresentationMode && handleMouseDown(e, element.id)
              }
            >
              <div
                contentEditable={!isPresentationMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => {
                  if (!isPresentationMode) {
                    handleTextEdit(element.id, e.target.textContent);
                  }
                }}
                className={`outline-none w-full h-full ${
                  isPresentationMode ? "pointer-events-none" : ""
                }`}
              >
                {element.content}
              </div>
            </div>
          ) : (
            <img
              src={element.src}
              alt="Slide element"
              className={`absolute select-none object-cover pointer-events-auto ${
                isPresentationMode ? "cursor-default" : "cursor-move"
              } ${
                selectedElement === element.id && !isPresentationMode
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
              }}
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent canvas click
                !isPresentationMode && handleMouseDown(e, element.id);
              }}
              draggable={false}
            />
          )}

          {selectedElement === element.id && !isPresentationMode && (
            <>
              {getResizeHandles(element).map((handle) => (
                <div
                  key={handle.type}
                  className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize z-10"
                  style={{
                    left: handle.x - 4,
                    top: handle.y - 4,
                    cursor: `${handle.type}-resize`,
                    pointerEvents: "auto", // Ensure handles are clickable
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle(handle.type);
                    const rect = canvasRef.current.getBoundingClientRect();
                    setDragStart({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );

  const renderQuizSlide = () => {
    if (isPresentationMode) {
      const userAnswer = quizAnswers[currentSlideData.id];
      const isAnswered = userAnswer !== undefined;
      const correctChoice = currentSlideData.choices.find(
        (c: any) => c.isCorrect
      );
      const isCorrect = isAnswered && userAnswer === correctChoice.id;

      return (
        <div className="w-[900px] h-[600px] bg-white rounded-lg shadow-lg p-8 overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <HelpCircle className="text-blue-500 mr-2" size={32} />
              <h2 className="text-3xl font-bold text-gray-800">
                Quiz Question
              </h2>
            </div>
            <div className="text-2xl text-gray-700 mb-8 p-4 bg-gray-50 rounded-lg">
              {currentSlideData.question}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {currentSlideData.choices.map((choice: any, index: any) => (
              <button
                key={choice.id}
                onClick={() =>
                  !isAnswered &&
                  handleQuizAnswer(currentSlideData.id, choice.id)
                }
                disabled={isAnswered}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all text-lg ${
                  isAnswered
                    ? choice.isCorrect
                      ? "bg-green-100 border-green-500 text-green-800"
                      : userAnswer === choice.id
                      ? "bg-red-100 border-red-500 text-red-800"
                      : "bg-gray-100 border-gray-300 text-gray-600"
                    : userAnswer === choice.id
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isAnswered
                        ? choice.isCorrect
                          ? "bg-green-500 text-white"
                          : userAnswer === choice.id
                          ? "bg-red-500 text-white"
                          : "bg-gray-300 text-gray-600"
                        : userAnswer === choice.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{choice.text}</span>
                  {isAnswered && choice.isCorrect && (
                    <Check className="ml-auto text-green-500" size={20} />
                  )}
                  {isAnswered &&
                    userAnswer === choice.id &&
                    !choice.isCorrect && (
                      <X className="ml-auto text-red-500" size={20} />
                    )}
                </div>
              </button>
            ))}
          </div>

          {isAnswered && currentSlideData.explanation && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Explanation:</h3>
              <p className="text-blue-700">{currentSlideData.explanation}</p>
            </div>
          )}

          {isAnswered && (
            <div
              className={`mt-4 p-4 rounded-lg text-center ${
                isCorrect
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div className="text-xl font-bold">
                {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Edit mode for quiz slides
    return (
      <div className="w-[900px] h-[600px] bg-white rounded-lg shadow-lg p-8 overflow-y-auto">
        {/* Question */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <HelpCircle className="text-blue-500 mr-2" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Question</h2>
          </div>
          <textarea
            value={currentSlideData.question}
            onChange={(e: any) => updateQuizSlide("question", e.target.value)}
            className="w-full p-4 text-xl border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none resize-none"
            rows={3}
            placeholder="Enter your question here..."
          />
        </div>

        {/* Choices */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Answer Choices
            </h3>
            <button
              onClick={addChoice}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
            >
              <Plus size={14} />
              <span>Add Choice</span>
            </button>
          </div>

          <div className="space-y-3">
            {currentSlideData.choices.map((choice: any, index: any) => (
              <div
                key={choice.id}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={choice.isCorrect}
                    onChange={(e) =>
                      updateChoice(choice.id, "isCorrect", e.target.checked)
                    }
                    className="text-green-500"
                  />
                  <label className="text-sm text-gray-600">Correct</label>
                </div>

                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) =>
                    updateChoice(choice.id, "text", e.target.value)
                  }
                  className="flex-1 p-2 border border-gray-200 rounded focus:border-blue-500 outline-none"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />

                {currentSlideData.choices.length > 2 && (
                  <button
                    onClick={() => removeChoice(choice.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Explanation (Optional)
          </h3>
          <textarea
            value={currentSlideData.explanation}
            onChange={(e) => updateQuizSlide("explanation", e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none resize-none"
            rows={3}
            placeholder="Explain why this answer is correct..."
          />
        </div>
      </div>
    );
  };

  if (isPresentationMode) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Presentation Header */}
        <div className="bg-gray-900 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold">Presentation Mode</h1>
            <span className="text-sm text-gray-400">
              Slide {currentSlide + 1} of {slides.length}
            </span>
          </div>
          <button
            onClick={togglePresentationMode}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            <X size={16} />
            <span>Exit</span>
          </button>
        </div>
        {/* In presentation mode header, add these buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={speakSlideContent}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Volume2 size={16} />
            <span>Speak</span>
          </button>

          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <VolumeX size={16} />
            </button>
          )}
        </div>
        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentSlideData.type === "basic"
            ? renderBasicSlide()
            : renderQuizSlide()}
        </div>
        {/* Add this section in the properties panel */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-md font-semibold mb-3">
            Text-to-Speech Settings
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speech Rate
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {speechRate}x speed
              </div>
            </div>

            {availableVoices.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voice
                </label>
                <select
                  value={speechVoice?.name || ""}
                  onChange={(e) => {
                    const voice = availableVoices.find(
                      (v: any) => v.name === e.target.value
                    );
                    setSpeechVoice(voice);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={speakSlideContent}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Volume2 size={16} />
              <span>Read Current Slide</span>
            </button>
          </div>
        </div>
        {/* Navigation */}
        <div className="bg-gray-900 p-4 flex items-center justify-center space-x-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>

          <div className="flex space-x-2">
            {slides.map((_: any, index: any) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  currentSlide === index ? "bg-white" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="bg-gray-900 px-6 py-2 text-xs text-gray-400 text-center">
          Use arrow keys or space to navigate • ESC to exit presentation mode
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Canvas PowerPoint</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Slide {currentSlide + 1} of {slides.length}
            </span>

            <button
              onClick={togglePresentationMode}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              <Play size={16} />
              <span>Present</span>
            </button>

            <button
              onClick={exportPresentation}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            {/* TTS Controls - Add these */}
            <button
              onClick={speakSlideContent}
              disabled={isSpeaking && !isPaused}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Volume2 size={16} />
              <span>Speak</span>
            </button>

            {/* This button only shows when speech is active */}
            {isSpeaking && (
              <button
                onClick={pauseResumeSpeech}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>
            )}

            {/* Stop button - only shows when speech is active */}
            {isSpeaking && (
              <button
                onClick={stopSpeech}
                className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                <VolumeX size={16} />
                <span>Stop</span>
              </button>
            )}

            {/* Basic Slide Tools */}
            {currentSlideData.type === "basic" && (
              <>
                <button
                  onClick={addTextElement}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <Type size={16} />
                  <span>Text</span>
                </button>
                <button
                  onClick={addImageElement}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                >
                  <Image size={16} />
                  <span>Image</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowSlideTypeModal(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              <span>Add Slide</span>
            </button>

            {slides.length > 1 && (
              <button
                onClick={deleteSlide}
                // Continue from your delete button:
                className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
            {/* TTS Controls */}
            <button
              onClick={speakSlideContent}
              disabled={isSpeaking && !isPaused}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Volume2 size={16} />
              <span>Speak</span>
            </button>

            {isSpeaking && (
              <button
                onClick={pauseResumeSpeech}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>
            )}

            {isSpeaking && (
              <button
                onClick={stopSpeech}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <VolumeX size={16} />
                <span>Stop</span>
              </button>
            )}

            {/* Exit button */}
            <button
              onClick={togglePresentationMode}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <X size={16} />
              <span>Exit</span>
            </button>
            {selectedElement && currentSlideData.type === "basic" && (
              <button
                onClick={deleteElement}
                className="flex items-center space-x-1 px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Element</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Slide Thumbnails */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Slides {showQuizResults}
          </h3>
          <div className="space-y-2">
            {slides.map((slide: any, index: any) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`w-full h-32 border-2 rounded-lg cursor-pointer transition-all ${
                  currentSlide === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="flex items-center space-x-2">
                    {slide.type === "quiz" ? (
                      <HelpCircle size={16} className="text-blue-500" />
                    ) : (
                      <Layout size={16} className="text-gray-500" />
                    )}
                    <span className="text-xs text-gray-600">
                      {slide.type === "quiz" ? "Quiz" : "Basic"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Slide {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentSlideData.type === "basic"
            ? renderBasicSlide()
            : renderQuizSlide()}
        </div>

        {/* Properties Panel - Always visible */}
        <div className="w-80 bg-white border-l p-4">
          <h3 className="text-lg font-semibold mb-4">Properties</h3>

          {selectedElementData && currentSlideData.type === "basic" ? (
            <div className="space-y-4">
              {/* Add this section in the properties panel */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-md font-semibold mb-3">
                  Text-to-Speech Settings
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Speech Rate
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) =>
                        setSpeechRate(parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      {speechRate}x speed
                    </div>
                  </div>

                  {availableVoices.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voice
                      </label>
                      <select
                        value={speechVoice?.name || ""}
                        onChange={(e) => {
                          const voice = availableVoices.find(
                            (v) => v.name === e.target.value
                          );
                          setSpeechVoice(voice);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        {availableVoices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={speakSlideContent}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    <Volume2 size={16} />
                    <span>Read Current Slide</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <input
                  type="number"
                  value={selectedElementData.fontSize || 18}
                  onChange={(e) =>
                    updateElement(selectedElement, {
                      fontSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="8"
                  max="72"
                />
              </div>

              {/* Rest of your existing properties controls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Weight
                </label>
                <select
                  value={selectedElementData.fontWeight || "normal"}
                  onChange={(e) =>
                    updateElement(selectedElement, {
                      fontWeight: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={selectedElementData.color || "#000000"}
                  onChange={(e) =>
                    updateElement(selectedElement, { color: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X Position
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.x || 0}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        x: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Y Position
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.y || 0}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        y: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.width || 100}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        width: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.height || 50}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        height: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <div className="mb-4">
                <Type size={48} className="mx-auto text-gray-300" />
              </div>
              <p className="text-sm">
                {currentSlideData.type === "quiz"
                  ? "Quiz slides don't have editable elements"
                  : "Select an element to edit its properties"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t px-6 py-3">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>

          <span className="text-sm text-gray-600">
            {currentSlide + 1} / {slides.length}
          </span>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Slide Type Modal */}
      {showSlideTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Choose Slide Type</h2>
            <div className="space-y-3">
              <button
                onClick={() => addSlide("basic")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Layout className="text-gray-600" size={24} />
                  <div>
                    <div className="font-semibold">Basic Slide</div>
                    <div className="text-sm text-gray-600">Text and images</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => addSlide("quiz")}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="text-blue-600" size={24} />
                  <div>
                    <div className="font-semibold">Quiz Slide</div>
                    <div className="text-sm text-gray-600">
                      Multiple choice question
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSlideTypeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
