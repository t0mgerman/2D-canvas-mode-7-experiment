import { Point } from "../app.types";

/** Converts a rotation in radians to a heading vector */
export function radiansToVector(rad: number) {
    return [
        Math.cos(rad), Math.sin(rad)
    ];
}

/** Converts a rotation in degrees to radians */
export function degreesToRadians(deg: number) {
    return deg * (Math.PI / 180);
}

/** Given two coordinates and a percentage, calculates the point between them
 *  When used for the screen y-axis include perspectiveCorrection param to perform perspective division
 */
export function getInterpolatedPoint(pointA: Point, pointB: Point, perc: number, perspectiveCorrection?: boolean) {
    if (perc === 0) return [...pointA];
    if (perc === 100) return [...pointB];
    if (perspectiveCorrection) {
        // ensures no divide by zero
        const p = isFinite(perc) ? perc : 0.1;
        const rtn = [
            // x1 = (Ax - Bx) / z + Bx
            (pointA[0] - pointB[0]) / p + pointB[0],
            // y1 = (Ay - By) / z + By
            (pointA[1] - pointB[1]) / p + pointB[1] 
        ];
        return rtn;
    } else {
        return [
            // x1 + (Bx - Ax) * z
            pointA[0] + (pointB[0] - pointA[0]) * perc,
            // y1 + (By - Ay) * z
            pointA[1] + (pointB[1] - pointA[1]) * perc
        ];
    }
}

/** Converts a hexadecimal string of 3,4,6 or 8 chars to an rgba array
 * Based on kennebec and Ben Carp's answers here: https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
*/
export function hexToRgbA(hex: string){
    let col, alpha;
    const hexToAlphaFloat = (a: number) => {
        if (a === undefined || isNaN(a)) return 1;
        return a / 255;
    };
    const m = hex.match(/^#(([A-Fa-f0-9]{3,4}){1,2})$/);
    if(m && m[1]) {
        col = m[1].split('');
        alpha = col.length == 4 ? col[3] : "F";
        if(col.length == 3 || col.length == 4){
            col = [col[0], col[0], col[1], col[1], col[2], col[2]];
        } 
        if (col.length == 4 || col.length == 6) {
            col.push(alpha, alpha); 
        }
        let hexCol: number = eval('0x' + col.join('')) as number;
        return [(hexCol>>24)&255, (hexCol>>16)&255, (hexCol>>8)&255, hexToAlphaFloat((hexCol&255))];
    }
    return [0,0,0,1];
}