document.addEventListener('DOMContentLoaded', function() {
    // العناصر الرئيسية
    const sliderTrackContainer = document.querySelector('.slider-track-container');
    const sliderTrack = document.getElementById('clientFeedbackTrack');
    const cards = document.querySelectorAll('.client-card');
    const dotsContainer = document.getElementById('sliderDots');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');

    // إذا لم يكن هناك بطاقات، لا داعي للاستمرار
    if (!cards.length) return;

    // المتغيرات الرئيسية
    let currentSlide = 0;
    let cardsPerSlide = getCardsPerSlide();
    let totalSlides = Math.ceil(cards.length / cardsPerSlide);

    // متغيرات للتعامل مع اللمس
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    let initialPosition = 0;
    let currentPosition = 0;

    // الحصول على عدد البطاقات لكل شريحة بناءً على حجم الشاشة
    function getCardsPerSlide() {
        if (window.innerWidth <= 576) return 1;
        if (window.innerWidth <= 768) return 2;
        return 3;
    }

    // إنشاء نقاط التنقل
    function createDots() {
        if (!dotsContainer) return;

        // إزالة النقاط الموجودة
        dotsContainer.innerHTML = '';

        // إنشاء النقاط الجديدة
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === currentSlide) dot.classList.add('active');
            dot.setAttribute('data-slide', i);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    // الانتقال إلى شريحة محددة
    function goToSlide(slideIndex) {
        // التأكد من عدم تجاوز الحدود
        if (slideIndex < 0) slideIndex = 0;
        if (slideIndex >= totalSlides) slideIndex = totalSlides - 1;

        currentSlide = slideIndex;

        // حساب عرض البطاقة الواحدة مع المسافة بينها
        const cardWidth = cards[0].offsetWidth;
        const cardMargin = parseInt(window.getComputedStyle(cards[0]).marginRight) || 30; // المسافة بين البطاقات (gap)
        const offset = slideIndex * cardsPerSlide * (cardWidth + cardMargin);

        // تحريك السلايدر
        sliderTrack.style.transform = `translateX(-${offset}px)`;

        // تحديث حالة النقاط
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });

        // تحديث حالة الأزرار
        if (prevButton) prevButton.disabled = currentSlide === 0;
        if (nextButton) nextButton.disabled = currentSlide === totalSlides - 1;

        // تطبيق تأثير حركي على البطاقات المرئية
        cards.forEach((card, index) => {
            const startIndex = currentSlide * cardsPerSlide;
            const endIndex = startIndex + cardsPerSlide - 1;

            // إضافة تأثيرات حركية للبطاقات المرئية
            if (index >= startIndex && index <= endIndex) {
                card.style.setProperty('--index', index - startIndex);
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
            }
        });
    }

    // التعامل مع تغيير حجم النافذة
    function handleResize() {
        const newCardsPerSlide = getCardsPerSlide();

        // إذا تغير عدد البطاقات لكل شريحة
        if (newCardsPerSlide !== cardsPerSlide) {
            cardsPerSlide = newCardsPerSlide;
            totalSlides = Math.ceil(cards.length / cardsPerSlide);

            // إعادة إنشاء النقاط
            createDots();

            // التأكد من أن currentSlide في النطاق الصحيح
            if (currentSlide >= totalSlides) {
                currentSlide = totalSlides - 1;
            }

            // إعادة عرض الشريحة الحالية
            goToSlide(currentSlide);
        }
    }

    // وظائف التعامل مع اللمس
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
        initialPosition = getCurrentTranslate();

        // إيقاف التأثير الحركي أثناء السحب
        sliderTrack.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        touchMoveX = e.touches[0].clientX;
        const diffX = touchMoveX - touchStartX;

        // حساب الموضع الجديد
        currentPosition = initialPosition + diffX;

        // تطبيق الموضع مع حدود لمنع السحب خارج النطاق
        const maxTranslate = 0;
        const minTranslate = -(totalSlides - 1) * cardsPerSlide * (cards[0].offsetWidth + parseInt(window.getComputedStyle(cards[0]).marginRight) || 30);

        if (currentPosition > maxTranslate) {
            currentPosition = maxTranslate + (currentPosition - maxTranslate) * 0.2; // مقاومة خفيفة
        } else if (currentPosition < minTranslate) {
            currentPosition = minTranslate + (currentPosition - minTranslate) * 0.2; // مقاومة خفيفة
        }

        sliderTrack.style.transform = `translateX(${currentPosition}px)`;
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        sliderTrack.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';

        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;

        // تحديد ما إذا كان السحب كافياً للانتقال للشريحة التالية/السابقة
        if (Math.abs(diffX) > 50) { // أكثر من 50 بكسل للانتقال
            if (diffX < 0 && currentSlide < totalSlides - 1) {
                // سحب لليسار -> الشريحة التالية
                goToSlide(currentSlide + 1);
            } else if (diffX > 0 && currentSlide > 0) {
                // سحب لليمين -> الشريحة السابقة
                goToSlide(currentSlide - 1);
            } else {
                // العودة للشريحة الحالية
                goToSlide(currentSlide);
            }
        } else {
            // العودة للشريحة الحالية إذا كان السحب غير كافٍ
            goToSlide(currentSlide);
        }
    }

    // الحصول على الموضع الحالي للسلايدر
    function getCurrentTranslate() {
        const style = window.getComputedStyle(sliderTrack);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41; // translateX value
    }

    // تهيئة السلايدر
    function initSlider() {
        // تطبيق الأنماط الأساسية
        sliderTrack.style.display = 'flex';
        sliderTrack.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';

        // إنشاء النقاط
        createDots();

        // إضافة مستمعي الأحداث للأزرار
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                goToSlide(currentSlide - 1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                goToSlide(currentSlide + 1);
            });
        }

        // إضافة مستمعي أحداث اللمس
        sliderTrack.addEventListener('touchstart', handleTouchStart, { passive: true });
        sliderTrack.addEventListener('touchmove', handleTouchMove, { passive: true });
        sliderTrack.addEventListener('touchend', handleTouchEnd);

        // مستمع لتغيير حجم النافذة
        window.addEventListener('resize', handleResize);

        // عرض الشريحة الأولى
        goToSlide(0);
    }

    // بدء تشغيل السلايدر
    initSlider();
});