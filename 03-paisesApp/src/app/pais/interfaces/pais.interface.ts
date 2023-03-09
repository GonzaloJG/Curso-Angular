// To parse this data:
//
//   import { Convert } from "./file";
//
//   const rESTCountriesResponse = Convert.toRESTCountriesResponse(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Country {
    name:           string;
    topLevelDomain: string[];
    alpha2Code:     string;
    alpha3Code:     string;
    callingCodes:   string[];
    capital:        string;
    altSpellings:   string[];
    subregion:      string;
    region:         string;
    population:     number;
    latlng:         number[];
    demonym:        string;
    area:           number;
    gini:           number;
    timezones:      string[];
    borders:        string[];
    nativeName:     string;
    numericCode:    string;
    flags:          Flags;
    currencies:     Currency[];
    languages:      Language[];
    translations:   Translations;
    flag:           string;
    regionalBlocs:  RegionalBloc[];
    cioc:           string;
    independent:    boolean;
}

export interface Currency {
    code:   string;
    name:   string;
    symbol: string;
}

export interface Flags {
    svg: string;
    png: string;
}

export interface Language {
    iso639_1:   string;
    iso639_2:   string;
    name:       string;
    nativeName: string;
}

export interface RegionalBloc {
    acronym:       string;
    name:          string;
    otherAcronyms: string[];
    otherNames:    string[];
}

export interface Translations {
    br: string;
    pt: string;
    nl: string;
    hr: string;
    fa: string;
    de: string;
    es: string;
    fr: string;
    ja: string;
    it: string;
    hu: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toRESTCountriesResponse(json: string): Country[] {
        return cast(JSON.parse(json), a(r("RESTCountriesResponse")));
    }

    public static rESTCountriesResponseToJson(value: Country[]): string {
        return JSON.stringify(uncast(value, a(r("RESTCountriesResponse"))), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "RESTCountriesResponse": o([
        { json: "name", js: "name", typ: "" },
        { json: "topLevelDomain", js: "topLevelDomain", typ: a("") },
        { json: "alpha2Code", js: "alpha2Code", typ: "" },
        { json: "alpha3Code", js: "alpha3Code", typ: "" },
        { json: "callingCodes", js: "callingCodes", typ: a("") },
        { json: "capital", js: "capital", typ: "" },
        { json: "altSpellings", js: "altSpellings", typ: a("") },
        { json: "subregion", js: "subregion", typ: "" },
        { json: "region", js: "region", typ: "" },
        { json: "population", js: "population", typ: 0 },
        { json: "latlng", js: "latlng", typ: a(0) },
        { json: "demonym", js: "demonym", typ: "" },
        { json: "area", js: "area", typ: 0 },
        { json: "gini", js: "gini", typ: 3.14 },
        { json: "timezones", js: "timezones", typ: a("") },
        { json: "borders", js: "borders", typ: a("") },
        { json: "nativeName", js: "nativeName", typ: "" },
        { json: "numericCode", js: "numericCode", typ: "" },
        { json: "flags", js: "flags", typ: r("Flags") },
        { json: "currencies", js: "currencies", typ: a(r("Currency")) },
        { json: "languages", js: "languages", typ: a(r("Language")) },
        { json: "translations", js: "translations", typ: r("Translations") },
        { json: "flag", js: "flag", typ: "" },
        { json: "regionalBlocs", js: "regionalBlocs", typ: a(r("RegionalBloc")) },
        { json: "cioc", js: "cioc", typ: "" },
        { json: "independent", js: "independent", typ: true },
    ], false),
    "Currency": o([
        { json: "code", js: "code", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "symbol", js: "symbol", typ: "" },
    ], false),
    "Flags": o([
        { json: "svg", js: "svg", typ: "" },
        { json: "png", js: "png", typ: "" },
    ], false),
    "Language": o([
        { json: "iso639_1", js: "iso639_1", typ: "" },
        { json: "iso639_2", js: "iso639_2", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "nativeName", js: "nativeName", typ: "" },
    ], false),
    "RegionalBloc": o([
        { json: "acronym", js: "acronym", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "otherAcronyms", js: "otherAcronyms", typ: a("") },
        { json: "otherNames", js: "otherNames", typ: a("") },
    ], false),
    "Translations": o([
        { json: "br", js: "br", typ: "" },
        { json: "pt", js: "pt", typ: "" },
        { json: "nl", js: "nl", typ: "" },
        { json: "hr", js: "hr", typ: "" },
        { json: "fa", js: "fa", typ: "" },
        { json: "de", js: "de", typ: "" },
        { json: "es", js: "es", typ: "" },
        { json: "fr", js: "fr", typ: "" },
        { json: "ja", js: "ja", typ: "" },
        { json: "it", js: "it", typ: "" },
        { json: "hu", js: "hu", typ: "" },
    ], false),
};
