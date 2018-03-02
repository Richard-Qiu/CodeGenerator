interface Array<T> {
    peek(): T;
    collect<U>(fn: (T) => Array<U>): Array<U>;
    pushRange(other: Array<T>): void;
    max(): number;
    min(): number;
    spliceArray(start: number, deleteCount: number, array: T[]): T[];
    clear(): void;
}
interface ArrayConstructor {
}
declare class Assertion {
    static check(cond: boolean, msg?: string): boolean;
    static assert(cond: boolean, msg?: string): void;
    static assertCode(cond: boolean): void;
    static die(): void;
    static oops(msg: string, attachments?: string[]): void;
}
declare class Exception {
    message: string;
    callStack: string;
    callStackWithArguments: string;
    constructor(message?: string);
    toString(): string;
    private getStackTrace();
    private getStackTraceWithArguments();
}
declare class DateInternalsForToStringWithFormat {
    static token: RegExp;
    static timezone: RegExp;
    static timezoneClip: RegExp;
    static pad: (val: any, len?: number) => any;
}
interface Date {
    isEmpty(): boolean;
    toStringWithFormat(format: string, utc?: boolean): string;
}
interface DateConstructor {
    empty: Date;
    isNullOrEmpty(str: Date): boolean;
}
declare class Guid {
    private static _emptyGuidString;
    private _data;
    static empty: Guid;
    private static _hex;
    constructor(s?: string);
    static generateHex(): string[];
    equals(g: Guid): boolean;
    static parse(s: string): Guid;
    isEmpty(): boolean;
    toString(): string;
    toStringWithFormat(format?: string): string;
    static newGuid(): Guid;
}
declare class GuidMap<T> {
    items: {
        [s: string]: T;
    };
    private length;
    static fromArray<T>(array: Array<T>, keySelector: (value: T) => Guid): GuidMap<T>;
    count(): number;
    keys(): Guid[];
    values(): T[];
    forEachValue(callbackfn: (value: T) => any): void;
    at(key: Guid): T;
    set(key: Guid, value: T): void;
    clear(): void;
    setMany(guidMap: GuidMap<T>): void;
    remove(key: string): T;
    toString(): string;
}
declare class JsonWriter {
    private _queue;
    private _root;
    private _current;
    private _isArray;
    private _cachedName;
    constructor();
    toString(): string;
    writeName(name: string): void;
    writeValue(value: any): void;
    write(name: string, value: any): void;
    static serializeValue(value: any): any;
    writeStartObject(): void;
    writeEndObject(): void;
    writeStartArray(): void;
    writeEndArray(): void;
}
declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
}
interface ILogger {
    Log(level: LogLevel, area: string, message: string, exception: any): any;
    Dump(): string;
}
declare module CommonInternals {
    class Log {
        level: LogLevel;
        area: string;
        message: string;
        exception: any;
        constructor(level: LogLevel, area: string, message: string, exception: any);
    }
}
declare class MemoryLogger implements ILogger {
    private _logs;
    constructor();
    Log(level: LogLevel, area: string, message: string, exception: any): void;
    Dump(): string;
}
declare class Logger {
    private static _logger;
    static SetLogger(logger: ILogger): void;
    static Dump(): string;
    static Debug(area: string, message: string): void;
    static Info(area: string, message: string): void;
    static Warning(area: string, message: string, exception?: any): void;
    static Error(area: string, message: string, exception?: any): void;
}
interface Number {
}
interface NumberConstructor {
}
interface Object {
}
interface ObjectConstructor {
    flatClone(obj: any): any;
    jsonClone<T>(obj: T): T;
    clone<T>(obj: T): T;
}
declare enum PromiseState {
    Pending = 0,
    Success = 1,
    Error = 2,
}
declare class Promise {
    _onNotify: (p: Promise) => void;
    static errorHandler: (ctx: string, err: any) => void;
    static checkHandler: (message: string) => void;
    _listeners: Promise[];
    _value: any;
    _state: PromiseState;
    _notify(l: Promise): void;
    isPending(): boolean;
    constructor(init: (onSuccess: (v: any) => any, onError: (v: any) => any, onProgress: (v: any) => any) => void, _onNotify?: (p: Promise) => void);
    _notifyListeners(): void;
    static propagate(s: PromiseState, v: any, onSuccess: (v: any) => any, onError: (v: any) => any): void;
    then(onSuccess: (v: any) => any, onError?: (v: any) => any, onProgress?: (v: any) => any): Promise;
    done(onSuccess?: (v: any) => any, onError?: (v: any) => any, onProgress?: (v: any) => any): void;
    thenalways(onSuccessOrError: (v: any) => any, onProgress?: (v: any) => any): Promise;
    static is(v: any): boolean;
    static as(v?: any): Promise;
    static wrap(v?: any): Promise;
    static wrapError(v?: any): Promise;
    static delay(ms: number, f?: () => Promise): Promise;
    static join(values: any): Promise;
    static thenEach(values: any, onSuccess?: (v: any) => any, onError?: (v: any) => any, onProgress?: (v: any) => any): Promise;
    static sequentialMap(values: any, f: (v: any, key: any, results: any) => any): Promise;
}
declare class PromiseInv extends Promise {
    success: (v: any) => void;
    error: (v: any) => void;
    constructor();
    static as(v?: any): PromiseInv;
}
declare class StringBuilder {
    private _parts;
    private _value;
    private _len;
    constructor();
    append(str: string): void;
    appendLine(str?: string): void;
    clear(): void;
    isEmpty(): boolean;
    toString(): string;
}
declare class StringInternals {
    static nativeTrimLeft: any;
    static nativeTrimRight: any;
    static nativeTrim: any;
    static escapeRegExp(str: string): string;
    static defaultToWhiteSpace(characters: string): string;
}
interface String {
    isEmpty(): boolean;
    startsWith(str: string, ignoreCase?: boolean): boolean;
    endsWith(str: string, ignoreCase?: boolean): boolean;
    trimStart(trimChars?: string): string;
    trimEnd(trimChars?: string): string;
    trim(trimChars?: string): string;
    replaceAll(pattern: string, replace: string, ignorecase?: boolean): string;
}
interface StringConstructor {
    isNullOrEmpty(str: string): boolean;
    repeat(str: string, count: number): string;
    format(formatString: string, ...params: any[]): string;
}
declare class StringUtility {
    static TrimEnd(str: string, ch: string): string;
    static levenshtein(str1: string, str2: string): number;
    static ConvertToHtml(str: string): string;
}
declare class StringMap<T> {
    items: {
        [s: string]: T;
    };
    private length;
    static fromArray<T>(array: Array<T>, keySelector: (value: T) => string): StringMap<T>;
    count(): number;
    keys(): string[];
    values(): T[];
    forEachValue(callbackfn: (value: T) => any): void;
    at(key: string): T;
    set(key: string, value: T): void;
    clear(): void;
    setMany(stringMap: StringMap<T>): void;
    remove(key: string): T;
    toString(): string;
}
declare class Uri {
    static Combine(url1: string, url2: string): string;
}
