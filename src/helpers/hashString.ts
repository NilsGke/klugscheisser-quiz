/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 * @source https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript#:~:text=%7D%0A%20%20%20%20return%20hash%3B%0A%7D-,2022%20EDIT%3A,-It%20has%20been
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export default hashString;
