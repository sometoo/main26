document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---

    // Canvas & Preview elements
    const canvasContainer = document.getElementById('canvas-container');
    const thumbnailCanvas = document.getElementById('thumbnail-canvas');
    const bgImage = document.getElementById('bg-image');

    // New Image layers
    const imageBlind = document.getElementById('image-blind');
    const imageBorderLayer = document.getElementById('image-border-layer');

    // Text Box elements
    const textBoxContainer = document.getElementById('text-box-container');
    const textBoxInner = document.getElementById('text-box-inner');
    const textBg = document.getElementById('text-bg');
    const textContent = document.getElementById('text-content');

    // UI Controls
    const exportBtn = document.getElementById('export-btn');
    const resetPosBtn = document.getElementById('reset-pos-btn');
    const imageUpload = document.getElementById('image-upload');

    const bgZoom = document.getElementById('bg-zoom');
    const blindOpacity = document.getElementById('blind-opacity');
    const blindOpacityVal = document.getElementById('blind-opacity-val');

    const imgBorderWidth = document.getElementById('img-border-width');
    const imgBorderWidthVal = document.getElementById('img-border-width-val');
    const imgBorderColor = document.getElementById('img-border-color');
    const imgBorderOffset = document.getElementById('img-border-offset');

    const bgOpacity = document.getElementById('bg-opacity');
    const bgOpacityVal = document.getElementById('bg-opacity-val');
    const bgColor = document.getElementById('bg-color');
    const bgPadding = document.getElementById('bg-padding');

    const fontFamily = document.getElementById('font-family');
    const textColor = document.getElementById('text-color');
    const fontSize = document.getElementById('font-size');
    const fontSizeVal = document.getElementById('font-size-val');
    const letterSpacing = document.getElementById('letter-spacing');
    const lineHeight = document.getElementById('line-height');

    // Drag Variables (Image)
    let isDraggingImage = false;
    let imgStartX = 0, imgStartY = 0;
    let imgOffsetX = 0, imgOffsetY = 0;

    // Drag Variables (Text Box)
    let isDraggingText = false;
    let textStartX = 0, textStartY = 0;
    let textPosX = 50, textPosY = 50; // percentage based

    // Virtual resolution is 1080x1080
    const CANV_W = 1080;
    const CANV_H = 1080;

    // --- Helper Functions ---
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        const paddingXY = isMobile ? 24 : 48;

        let containerWidth = canvasContainer.parentElement.clientWidth - paddingXY;
        let containerHeight = canvasContainer.parentElement.clientHeight - paddingXY;

        if (isMobile) {
            // On mobile, parent container height is dynamic. We constrain it to max 50% of viewport height
            // so the control panel stays visible.
            containerWidth = window.innerWidth - paddingXY;
            containerHeight = window.innerHeight * 0.45;
        }

        // Target is 1:1
        let newSize = Math.min(containerWidth, containerHeight);

        // Ensure max bounds doesn't grow huge on large monitors
        if (newSize > 800) newSize = 800; // Visual limit

        canvasContainer.style.width = `${newSize}px`;
        canvasContainer.style.height = `${newSize}px`;

        // 1080x1080 fixed, calculate its scale inside its container
        const scale = newSize / CANV_W;
        thumbnailCanvas.style.transform = `scale(${scale})`;
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // Prevent text editing when dragging the wrapper
    textContent.addEventListener('mousedown', (e) => {
        // If clicking on text, don't drag the box
        e.stopPropagation();
    });

    // --- Drag Logic: Text Box ---
    textBoxContainer.addEventListener('mousedown', (e) => {
        if (e.target === textContent) return; // Ignore actual text content area for dragging
        e.preventDefault();
        isDraggingText = true;
        textStartX = e.clientX;
        textStartY = e.clientY;
    });

    textBoxContainer.addEventListener('touchstart', (e) => {
        if (e.target === textContent) return;
        if (e.cancelable) e.preventDefault();
        isDraggingText = true;
        textStartX = e.touches[0].clientX;
        textStartY = e.touches[0].clientY;
    }, { passive: false });

    // --- Drag Logic: Background Image ---
    const bgLayer = document.getElementById('bg-layer');
    bgLayer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDraggingImage = true;
        imgStartX = e.clientX;
        imgStartY = e.clientY;
    });

    bgLayer.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
        isDraggingImage = true;
        imgStartX = e.touches[0].clientX;
        imgStartY = e.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('mousemove', (e) => {
        handleDragMove(e.clientX, e.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        if (isDraggingText || isDraggingImage) {
            if (e.cancelable) e.preventDefault();
        }
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    function handleDragMove(clientX, clientY) {
        if (isDraggingText) {
            const currentScale = parseFloat(thumbnailCanvas.style.transform.replace('scale(', '').replace(')', ''));
            const dx = (clientX - textStartX) / currentScale;
            const dy = (clientY - textStartY) / currentScale;

            textPosX += (dx / CANV_W) * 100;
            textPosY += (dy / CANV_H) * 100;

            textPosX = Math.max(0, Math.min(100, textPosX));
            textPosY = Math.max(0, Math.min(100, textPosY));

            updateTextBoxPosition();

            textStartX = clientX;
            textStartY = clientY;
        }

        if (isDraggingImage) {
            const currentScale = parseFloat(thumbnailCanvas.style.transform.replace('scale(', '').replace(')', ''));
            const dx = (clientX - imgStartX) / currentScale;
            const dy = (clientY - imgStartY) / currentScale;

            imgOffsetX += dx;
            imgOffsetY += dy;

            updateImageTransform();

            imgStartX = clientX;
            imgStartY = clientY;
        }
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    function endDrag() {
        isDraggingText = false;
        isDraggingImage = false;
    }

    function updateTextBoxPosition() {
        textBoxContainer.style.left = `${textPosX}%`;
        textBoxContainer.style.top = `${textPosY}%`;
    }

    function updateImageTransform() {
        const zoom = parseFloat(bgZoom.value);
        bgImage.style.transform = `translate(calc(-50% + ${imgOffsetX}px), calc(-50% + ${imgOffsetY}px)) scale(${zoom})`;
    }

    // --- Control Event Listeners ---

    // Background Image
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                bgImage.src = event.target.result;
                bgImage.style.display = 'block';
                // Reset positions
                imgOffsetX = 0; imgOffsetY = 0;
                bgZoom.value = 1;
                updateImageTransform();
            }
            reader.readAsDataURL(file);
        }
    });

    bgZoom.addEventListener('input', updateImageTransform);

    // Image Blind
    blindOpacity.addEventListener('input', (e) => {
        const val = e.target.value;
        imageBlind.style.backgroundColor = `rgba(0, 0, 0, ${val})`;
        blindOpacityVal.textContent = `${Math.round(val * 100)}%`;
    });

    // Image Border
    function updateImageBorder() {
        const width = imgBorderWidth.value;
        const color = imgBorderColor.value;
        const offset = imgBorderOffset.value;

        imageBorderLayer.style.border = `${width}px solid ${color}`;
        imageBorderLayer.style.top = `${offset}px`;
        imageBorderLayer.style.left = `${offset}px`;
        imageBorderLayer.style.right = `${offset}px`;
        imageBorderLayer.style.bottom = `${offset}px`;
    }

    imgBorderWidth.addEventListener('input', (e) => {
        imgBorderWidthVal.textContent = `${e.target.value}px`;
        updateImageBorder();
    });
    imgBorderColor.addEventListener('input', updateImageBorder);
    imgBorderOffset.addEventListener('input', updateImageBorder);


    // Text Box Background
    function updateTextBoxBg() {
        const color = bgColor.value;
        const opacity = bgOpacity.value;
        // Convert hex to rgb
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        textBg.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    bgOpacity.addEventListener('input', (e) => {
        bgOpacityVal.textContent = `${Math.round(e.target.value * 100)}%`;
        updateTextBoxBg();
    });
    bgColor.addEventListener('input', updateTextBoxBg);

    bgPadding.addEventListener('input', (e) => {
        textBoxInner.style.padding = `${e.target.value}px`;
    });

    // Text Styles
    fontFamily.addEventListener('change', (e) => {
        textContent.style.fontFamily = e.target.value;
    });

    textColor.addEventListener('input', (e) => {
        textContent.style.color = e.target.value;
    });

    fontSize.addEventListener('input', (e) => {
        const val = e.target.value;
        textContent.style.fontSize = `${val}px`;
        fontSizeVal.textContent = `${val}px`;
    });

    letterSpacing.addEventListener('input', (e) => {
        textContent.style.letterSpacing = `${e.target.value}px`;
    });

    lineHeight.addEventListener('input', (e) => {
        textContent.style.lineHeight = e.target.value;
    });


    // Reset Button
    resetPosBtn.addEventListener('click', () => {
        textPosX = 50;
        textPosY = 50;
        updateTextBoxPosition();

        imgOffsetX = 0;
        imgOffsetY = 0;
        bgZoom.value = 1;
        updateImageTransform();
    });

    // Export Logic
    exportBtn.addEventListener('click', () => {
        // Change text-content slightly during export to remove active cursor/selection
        window.getSelection().removeAllRanges();

        const originalTransform = thumbnailCanvas.style.transform;
        // Temporary reset scale to 1 to capture full 1080x1080 resolution
        thumbnailCanvas.style.transform = 'scale(1)';

        // Briefly show a loading state
        exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';
        exportBtn.disabled = true;

        setTimeout(() => {
            html2canvas(thumbnailCanvas, {
                width: CANV_W,
                height: CANV_H,
                scale: 1, // 1:1 scale export
                useCORS: true,
                backgroundColor: '#000000',
                logging: false
            }).then(canvas => {
                // Restore transform
                thumbnailCanvas.style.transform = originalTransform;
                exportBtn.innerHTML = '<i class="fa-solid fa-download"></i> 이미지 저장';
                exportBtn.disabled = false;

                // Create download link
                const link = document.createElement('a');
                link.download = `썸네일_1x1_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error("Export Error: ", err);
                thumbnailCanvas.style.transform = originalTransform;
                exportBtn.innerHTML = '<i class="fa-solid fa-download"></i> 이미지 저장';
                exportBtn.disabled = false;
                alert("썸네일 이미지 변환 중 오류가 발생했습니다.");
            });
        }, 100);
    });

    // Initialize defaults
    updateImageBorder();
    updateTextBoxBg();
});
