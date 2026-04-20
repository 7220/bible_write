// 성경 데이터 외부 모듈에서 불러오기
import { bibleData } from './data/bible.js';

// DOM 요소
const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const startBtn = document.getElementById('start-btn');
const dictationArea = document.getElementById('dictation-area');
const settingsPanel = document.querySelector('.settings-panel');
const verseInfo = document.getElementById('verse-info');
const hintBtn = document.getElementById('hint-btn');
const hintText = document.getElementById('hint-text');
const answerInput = document.getElementById('answer-input');
const checkBtn = document.getElementById('check-btn');
const skipBtn = document.getElementById('skip-btn');
const nextBtn = document.getElementById('next-btn');
const resultArea = document.getElementById('result-area');
const resultCard = document.getElementById('result-card');
const resultTitle = document.getElementById('result-title');
const correctAnswer = document.getElementById('correct-answer');
const userAnswer = document.getElementById('user-answer');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const finalResult = document.getElementById('final-result');
const finalScore = document.getElementById('final-score');
const scoreDetail = document.getElementById('score-detail');
const restartBtn = document.getElementById('restart-btn');

// 상태 관리
let currentBook = '';
let currentChapter = '';
let verses = [];
let verseOrder = [];
let currentIndex = 0;
let correctCount = 0;
let isRandom = false;

// 초기화
function init() {
    populateBooks();
    setupEventListeners();
}

// 성경 책 목록 채우기
function populateBooks() {
    const books = Object.keys(bibleData);
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        bookSelect.appendChild(option);
    });
}

// 장 목록 채우기
function populateChapters(book) {
    chapterSelect.innerHTML = '<option value="">장을 선택하세요</option>';
    
    if (!book || !bibleData[book]) {
        chapterSelect.disabled = true;
        return;
    }

    const chapters = Object.keys(bibleData[book]);
    chapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = `${chapter}장`;
        chapterSelect.appendChild(option);
    });
    
    chapterSelect.disabled = false;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    bookSelect.addEventListener('change', (e) => {
        currentBook = e.target.value;
        populateChapters(currentBook);
        updateStartButton();
    });

    chapterSelect.addEventListener('change', (e) => {
        currentChapter = e.target.value;
        updateStartButton();
    });

    startBtn.addEventListener('click', startDictation);
    checkBtn.addEventListener('click', checkAnswer);
    skipBtn.addEventListener('click', skipVerse);
    nextBtn.addEventListener('click', nextVerse);
    hintBtn.addEventListener('click', showHint);
    restartBtn.addEventListener('click', restart);

    // Enter 키로 확인
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            checkAnswer();
        }
    });
}

// 시작 버튼 활성화 업데이트
function updateStartButton() {
    startBtn.disabled = !(currentBook && currentChapter);
}

// 받아쓰기 시작
function startDictation() {
    // 출제 방식 확인
    isRandom = document.querySelector('input[name="mode"]:checked').value === 'random';
    
    // 구절 가져오기
    verses = bibleData[currentBook][currentChapter];
    
    // 순서 설정
    verseOrder = [...Array(verses.length).keys()];
    if (isRandom) {
        shuffleArray(verseOrder);
    }
    
    // 상태 초기화
    currentIndex = 0;
    correctCount = 0;
    
    // UI 전환
    settingsPanel.style.display = 'none';
    dictationArea.style.display = 'block';
    finalResult.style.display = 'none';
    
    // 첫 번째 구절 표시
    showVerse();
}

// 배열 셔플 (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 현재 구절 표시
function showVerse() {
    const verseIndex = verseOrder[currentIndex];
    const verse = verses[verseIndex];
    
    // 구절 정보 표시
    verseInfo.innerHTML = `<h2>${currentBook} ${currentChapter}장 ${verse.verse}절</h2>`;
    
    // 진행률 업데이트
    const progress = ((currentIndex) / verses.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentIndex + 1} / ${verses.length}`;
    
    // 입력 초기화
    answerInput.value = '';
    answerInput.focus();
    
    // 힌트 숨기기
    hintText.style.display = 'none';
    hintBtn.textContent = '💡 힌트 보기';
}

// 힌트 표시
function showHint() {
    const verseIndex = verseOrder[currentIndex];
    const verse = verses[verseIndex];
    const text = verse.text;
    
    if (hintText.style.display === 'none') {
        // 첫 글자들만 보여주기
        const hint = text.split(' ').map(word => {
            if (word.length <= 1) return word;
            return word[0] + '○'.repeat(word.length - 1);
        }).join(' ');
        
        hintText.textContent = hint;
        hintText.style.display = 'block';
        hintBtn.textContent = '💡 힌트 숨기기';
    } else {
        hintText.style.display = 'none';
        hintBtn.textContent = '💡 힌트 보기';
    }
}

// 답 확인
function checkAnswer() {
    const verseIndex = verseOrder[currentIndex];
    const verse = verses[verseIndex];
    const correctText = normalizeText(verse.text);
    const userText = normalizeText(answerInput.value);
    
    const isCorrect = correctText === userText;
    
    if (isCorrect) {
        correctCount++;
        resultTitle.textContent = '✅ 정답입니다!';
        resultTitle.className = 'correct';
    } else {
        resultTitle.textContent = '❌ 아쉬워요';
        resultTitle.className = 'incorrect';
    }
    
    correctAnswer.textContent = verse.text;
    userAnswer.innerHTML = isCorrect 
        ? answerInput.value 
        : highlightDifferences(verse.text, answerInput.value);
    
    resultArea.style.display = 'flex';
}

// 텍스트 정규화 (비교용)
function normalizeText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:'"()]/g, '')
        .trim()
        .toLowerCase();
}

// 차이점 하이라이트
function highlightDifferences(correct, user) {
    const correctWords = correct.split(/\s+/);
    const userWords = user.split(/\s+/);
    
    let result = '';
    const maxLen = Math.max(correctWords.length, userWords.length);
    
    for (let i = 0; i < maxLen; i++) {
        const cWord = correctWords[i] || '';
        const uWord = userWords[i] || '';
        
        if (normalizeText(cWord) === normalizeText(uWord)) {
            result += `<span class="highlight-correct">${uWord}</span> `;
        } else if (uWord) {
            result += `<span class="highlight-wrong">${uWord}</span> `;
        }
    }
    
    return result.trim();
}

// 건너뛰기
function skipVerse() {
    const verseIndex = verseOrder[currentIndex];
    const verse = verses[verseIndex];
    
    resultTitle.textContent = '⏭️ 건너뛰었습니다';
    resultTitle.className = '';
    correctAnswer.textContent = verse.text;
    userAnswer.textContent = '(입력 없음)';
    
    resultArea.style.display = 'flex';
}

// 다음 구절
function nextVerse() {
    resultArea.style.display = 'none';
    currentIndex++;
    
    if (currentIndex >= verses.length) {
        showFinalResult();
    } else {
        showVerse();
    }
}

// 최종 결과 표시
function showFinalResult() {
    dictationArea.style.display = 'none';
    finalResult.style.display = 'block';
    
    const score = Math.round((correctCount / verses.length) * 100);
    finalScore.textContent = score;
    scoreDetail.textContent = `${verses.length}개 중 ${correctCount}개 정답`;
}

// 다시 시작
function restart() {
    finalResult.style.display = 'none';
    settingsPanel.style.display = 'block';
    
    // 선택 초기화
    bookSelect.value = '';
    chapterSelect.innerHTML = '<option value="">장을 선택하세요</option>';
    chapterSelect.disabled = true;
    startBtn.disabled = true;
    
    currentBook = '';
    currentChapter = '';
}

// 앱 시작
init();
