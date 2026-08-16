import React, { useState, useEffect } from 'react';
import './TutorialCompanion.css';
import { TUTORIAL_CURRICULUMS } from './tutorialData';
import ProfessorQuarkAvatar from './ProfessorQuarkAvatar';

export function TutorialCompanion({
  activeSimulation = 'home',
  isOpen = false,
  onOpen = () => {},
  onClose = () => {},
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch current curriculum based on active laboratory
  const curriculum = TUTORIAL_CURRICULUMS[activeSimulation] || TUTORIAL_CURRICULUMS.home;
  const totalSteps = curriculum.steps.length;
  const currentStep = curriculum.steps[currentStepIndex] || curriculum.steps[0];

  // Reset step & quiz when switching simulations
  useEffect(() => {
    setCurrentStepIndex(0);
    setSelectedQuizAnswer(null);
    setIsQuizSubmitted(false);
    setIsQuizCorrect(false);
  }, [activeSimulation]);

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((idx) => idx + 1);
      setSelectedQuizAnswer(null);
      setIsQuizSubmitted(false);
      setIsQuizCorrect(false);
    } else {
      // Completed last step!
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((idx) => idx - 1);
      setSelectedQuizAnswer(null);
      setIsQuizSubmitted(false);
      setIsQuizCorrect(false);
    }
  };

  const handleSelectQuizOption = (optionIndex) => {
    if (isQuizSubmitted && isQuizCorrect) return; // already solved
    setSelectedQuizAnswer(optionIndex);
    const correct = optionIndex === currentStep.quiz.correctIndex;
    setIsQuizCorrect(correct);
    setIsQuizSubmitted(true);
  };

  // Determine current emotional expression
  let activeExpression = currentStep.expression || 'EXPLAINING';
  if (currentStep.quiz && isQuizSubmitted) {
    activeExpression = isQuizCorrect ? 'CELEBRATING' : 'THINKING';
  }

  // Format simple markdown bold and bullet points in dialogue
  const renderFormattedSpeech = (text) => {
    if (!text) return null;
    const paragraphs = text.split('\n\n');
    return paragraphs.map((p, pIdx) => {
      // Parse bold tags **word**
      const parts = p.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={pIdx} className="tutorial-speech-para">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="speech-highlight">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // --------------------------------------------------------------------------
  // 1. DOCKED FLOATING LAUNCHER (When Tutorial is closed)
  // --------------------------------------------------------------------------
  if (!isOpen) {
    return (
      <button
        type="button"
        className="piplu-floating-launcher-btn"
        onClick={onOpen}
        title="Learn with Professor Piplu 🐧 (Interactive Guide & Quizzes)"
        aria-label="Open Interactive Tutorial with Professor Piplu"
      >
        <div className="launcher-avatar-container">
          <ProfessorQuarkAvatar expression="EXPLAINING" size={36} />
        </div>
        <span className="launcher-text">Ask Piplu 🐧</span>
        <span className="launcher-sparkle-badge">Guide</span>
      </button>
    );
  }

  // --------------------------------------------------------------------------
  // 2. MINIMIZED FLOATING BADGE VIEW (When user clicks minimize '—')
  // --------------------------------------------------------------------------
  if (isMinimized) {
    return (
      <div
        className="tutorial-minimized-badge"
        onClick={() => setIsMinimized(false)}
        title="Click to resume Professor Piplu's tutorial"
      >
        <ProfessorQuarkAvatar expression={activeExpression} size={42} />
        <div className="minimized-text-group">
          <strong className="minimized-name">Prof. Piplu 🐧</strong>
          <span className="minimized-step">
            Lesson {currentStepIndex + 1}/{totalSteps} • Tap to Expand
          </span>
        </div>
        <button
          type="button"
          className="minimized-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Exit Tutorial"
        >
          ✕
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. FULL DUOLINGO-STYLE TUTORIAL DIALOG CARD
  // --------------------------------------------------------------------------
  return (
    <aside className="tutorial-companion-modal-overlay">
      <div className="tutorial-dialog-card surface-cream" role="dialog" aria-modal="false">
        {/* Header Bar with Segmented Progress */}
        <div className="tutorial-dialog-header">
          <div className="tutorial-progress-container">
            <div className="tutorial-progress-segments">
              {curriculum.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`progress-segment ${
                    idx < currentStepIndex
                      ? 'completed'
                      : idx === currentStepIndex
                      ? 'active'
                      : ''
                  }`}
                />
              ))}
            </div>
            <span className="step-counter-text">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>

          <div className="tutorial-window-controls">
            <button
              type="button"
              className="win-ctrl-btn minimize-btn"
              onClick={() => setIsMinimized(true)}
              title="Minimize to floating mascot badge"
            >
              —
            </button>
            <button
              type="button"
              className="win-ctrl-btn close-btn"
              onClick={onClose}
              title="Close Tutorial"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Character Mascot & Interactive Dialogue Body */}
        <div className="tutorial-body-grid">
          {/* Character Avatar Column */}
          <div className="tutorial-character-col">
            <ProfessorQuarkAvatar expression={activeExpression} size={110} />
            <div className="character-nameplate">
              <strong>Prof. Piplu 🐧</strong>
              <span>STEM Tutor</span>
            </div>
          </div>

          {/* Speech & Quiz Column */}
          <div className="tutorial-content-col">
            <div className="tutorial-concept-badge-row">
              <span className="tutorial-concept-pill">{currentStep.conceptTag}</span>
              <span className="tutorial-lab-name">{curriculum.title}</span>
            </div>

            <h3 className="tutorial-step-title">{currentStep.title}</h3>

            {/* Speech Dialogue Bubble */}
            <div className="tutorial-speech-bubble">
              {renderFormattedSpeech(currentStep.speech)}
            </div>

            {/* Action Prompt (Interactive Challenge hint) */}
            {currentStep.actionPrompt && !currentStep.quiz && (
              <div className="tutorial-action-prompt-card">
                <span className="prompt-icon">👉</span>
                <span className="prompt-text">
                  <strong>Try it on the stage:</strong> {currentStep.actionPrompt}
                </span>
              </div>
            )}

            {/* Mini-Quiz Checkpoint Card (Duolingo Style) */}
            {currentStep.quiz && (
              <div className="tutorial-quiz-container">
                <div className="quiz-question-header">
                  <span className="quiz-icon">🎯</span>
                  <strong className="quiz-question-text">{currentStep.quiz.question}</strong>
                </div>

                <div className="quiz-options-list">
                  {currentStep.quiz.options.map((opt, optIdx) => {
                    const isSelected = selectedQuizAnswer === optIdx;
                    let optionStatusClass = '';
                    if (isQuizSubmitted) {
                      if (optIdx === currentStep.quiz.correctIndex) {
                        optionStatusClass = 'is-correct-answer';
                      } else if (isSelected && !isQuizCorrect) {
                        optionStatusClass = 'is-wrong-answer';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`quiz-option-btn ${isSelected ? 'selected' : ''} ${optionStatusClass}`}
                        onClick={() => handleSelectQuizOption(optIdx)}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="option-label">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quiz Feedback Banner */}
                {isQuizSubmitted && (
                  <div className={`quiz-feedback-banner ${isQuizCorrect ? 'success' : 'retry'}`}>
                    <span className="feedback-emoji">{isQuizCorrect ? '🌟' : '💡'}</span>
                    <div className="feedback-text-group">
                      <strong>{isQuizCorrect ? 'Awesome! That is correct!' : 'Not quite, try another option!'}</strong>
                      <p>{isQuizCorrect ? currentStep.quiz.explanation : 'Re-read the question carefully and try picking the best physical answer.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="tutorial-dialog-footer">
          <button
            type="button"
            className="tutorial-nav-btn prev-btn"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
          >
            ⬅️ Back
          </button>

          <div className="footer-right-actions">
            {currentStepIndex === totalSteps - 1 ? (
              <button
                type="button"
                className="tutorial-nav-btn finish-btn"
                onClick={handleNext}
              >
                🎉 Complete Lesson
              </button>
            ) : (
              <button
                type="button"
                className="tutorial-nav-btn next-btn"
                onClick={handleNext}
              >
                Continue ➔
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default TutorialCompanion;
