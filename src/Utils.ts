export const EMOJI = {
    PAGINATION: {
        PREVIOUS: "◀️",
        NEXT: "▶️",
    },
};

// Credits to https://github.com/facebook/react/blob/55d75005bc26aa41cddc090273f82aa106729fb8/packages/shared/shallowEqual.js
const objectIsPolyfill = (x: any, y: any) => (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
const objectIs: (x: any, y: any) => boolean = typeof Object.is === "function" ? Object.is : objectIsPolyfill;
export const shallowEqual = (objA: any, objB: any): boolean => {
    if (objectIs(objA, objB)) {
        return true;
    }

    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
    }

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (const currentKey of keysA) {
        if (!Object.prototype.hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey])) {
            return false;
        }
    }

    return true;
};

// Splits the provided array into `n` pages with each `entriesPerPage` entries. `minPerPage` defines how many
// entries a single page has to have at minimum. As an example using the default values, if the last page would
// only contain a single entry it will instead be put into the second last page which will then contain 5 elements.
// I yoinked this code from another bot I develop.
export const splitToPages = <T>(data: T[], entriesPerPage: number = 4, minPerPage: number = 2): T[][] => {
    const count = data.length;
    const pages: T[][] = [];
    for (let i = 0; i < count; i += entriesPerPage) {
        const mergeLastPage = count - i - entriesPerPage < minPerPage;
        pages.push(mergeLastPage ? data.slice(i) : data.slice(i, i + entriesPerPage));
        if (mergeLastPage) {
            break;
        }
    }
    return pages;
};

export const clone = <T extends {}>(source: T): T => Object.assign({}, source);
