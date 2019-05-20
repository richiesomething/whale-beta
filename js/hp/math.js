let scaleRectToFitRect = function (innerRect, outerRect) {
    const innerRectAr = innerRect.w / innerRect.h;
    const outerRectAr = outerRect.w / outerRect.h;

    let outRect = {
        x: outerRect.x, y: outerRect.y,
        w: outerRect.w, h: outerRect.h
    };
    if (innerRectAr > outerRectAr) {
        // Pad vertically, fit horizontally
        outRect.h = innerRect.h * (outerRect.w / innerRect.w);
        outRect.y += (outerRect.h - outRect.h) / 2;
    } else if (outerRect < innerRect) {
        // Pad horizontally, fit vertically
        outRect.w = innerRect.w * (outerRect.h / innerRect.h);
        outRect.x += (outerRect.w - outRect.w) / 2;
    }
    return outRect;
};

let collidePointInRect = function (rect, pt) {
    return (pt.x >= rect.x) && (pt.y >= rect.y) &&
           (pt.x - rect.x <= rect.w) && (pt.y - rect.y <= rect.h);
};

let collideRectInRect = function (a, b) {
    return (
        collidePointInRect(a, {x: b.x + b.w, y: b.y + b.h}) ||
        collidePointInRect(b, {x: a.x + a.w, y: a.y + a.h})
    );
};
