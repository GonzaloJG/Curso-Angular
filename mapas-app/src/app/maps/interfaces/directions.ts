// To parse this data:
//
//   import { Convert, DirectionsResponse } from "./file";
//
//   const directionsResponse = Convert.toDirectionsResponse(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface DirectionsResponse {
    routes:    Route[];
    waypoints: Waypoint[];
    code:      string;
    uuid:      string;
}

export interface Route {
    weight_name: string;
    weight:      number;
    duration:    number;
    distance:    number;
    legs:        Leg[];
    geometry:    Geometry;
}

export interface Geometry {
    coordinates: Array<number[]>;
    type:        Type;
}

export enum Type {
    LineString = "LineString",
}

export interface Leg {
    via_waypoints: any[];
    admins:        Admin[];
    weight:        number;
    duration:      number;
    steps:         Step[];
    distance:      number;
    summary:       string;
}

export interface Admin {
    iso_3166_1_alpha3: string;
    iso_3166_1:        string;
}

export interface Step {
    intersections: Intersection[];
    maneuver:      Maneuver;
    name:          string;
    duration:      number;
    distance:      number;
    driving_side:  DrivingSide;
    weight:        number;
    mode:          Mode;
    geometry:      Geometry;
    destinations?: string;
    ref?:          string;
    exits?:        string;
}

export enum DrivingSide {
    Left = "left",
    Right = "right",
    SlightLeft = "slight left",
    SlightRight = "slight right",
    Straight = "straight",
}

export interface Intersection {
    bearings:           number[];
    entry:              boolean[];
    mapbox_streets_v8?: MapboxStreetsV8;
    is_urban?:          boolean;
    admin_index:        number;
    out?:               number;
    geometry_index:     number;
    location:           number[];
    weight?:            number;
    traffic_signal?:    boolean;
    turn_duration?:     number;
    turn_weight?:       number;
    duration?:          number;
    in?:                number;
    classes?:           Class[];
    lanes?:             Lane[];
    railway_crossing?:  boolean;
    stop_sign?:         boolean;
}

export enum Class {
    Motorway = "motorway",
    MotorwayLink = "motorway_link",
    Secondary = "secondary",
    SecondaryLink = "secondary_link",
    Street = "street",
    Tertiary = "tertiary",
    TertiaryLink = "tertiary_link",
}

export interface Lane {
    indications:       DrivingSide[];
    valid:             boolean;
    active:            boolean;
    valid_indication?: DrivingSide;
}

export interface MapboxStreetsV8 {
    class: Class;
}

export interface Maneuver {
    type:           string;
    instruction:    string;
    bearing_after:  number;
    bearing_before: number;
    location:       number[];
    modifier?:      DrivingSide;
}

export enum Mode {
    Driving = "driving",
}

export interface Waypoint {
    distance: number;
    name:     string;
    location: number[];
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toDirectionsResponse(json: string): DirectionsResponse {
        return cast(JSON.parse(json), r("DirectionsResponse"));
    }

    public static directionsResponseToJson(value: DirectionsResponse): string {
        return JSON.stringify(uncast(value, r("DirectionsResponse")), null, 2);
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
    "DirectionsResponse": o([
        { json: "routes", js: "routes", typ: a(r("Route")) },
        { json: "waypoints", js: "waypoints", typ: a(r("Waypoint")) },
        { json: "code", js: "code", typ: "" },
        { json: "uuid", js: "uuid", typ: "" },
    ], false),
    "Route": o([
        { json: "weight_name", js: "weight_name", typ: "" },
        { json: "weight", js: "weight", typ: 3.14 },
        { json: "duration", js: "duration", typ: 3.14 },
        { json: "distance", js: "distance", typ: 3.14 },
        { json: "legs", js: "legs", typ: a(r("Leg")) },
        { json: "geometry", js: "geometry", typ: r("Geometry") },
    ], false),
    "Geometry": o([
        { json: "coordinates", js: "coordinates", typ: a(a(3.14)) },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "Leg": o([
        { json: "via_waypoints", js: "via_waypoints", typ: a("any") },
        { json: "admins", js: "admins", typ: a(r("Admin")) },
        { json: "weight", js: "weight", typ: 3.14 },
        { json: "duration", js: "duration", typ: 3.14 },
        { json: "steps", js: "steps", typ: a(r("Step")) },
        { json: "distance", js: "distance", typ: 3.14 },
        { json: "summary", js: "summary", typ: "" },
    ], false),
    "Admin": o([
        { json: "iso_3166_1_alpha3", js: "iso_3166_1_alpha3", typ: "" },
        { json: "iso_3166_1", js: "iso_3166_1", typ: "" },
    ], false),
    "Step": o([
        { json: "intersections", js: "intersections", typ: a(r("Intersection")) },
        { json: "maneuver", js: "maneuver", typ: r("Maneuver") },
        { json: "name", js: "name", typ: "" },
        { json: "duration", js: "duration", typ: 3.14 },
        { json: "distance", js: "distance", typ: 3.14 },
        { json: "driving_side", js: "driving_side", typ: r("DrivingSide") },
        { json: "weight", js: "weight", typ: 3.14 },
        { json: "mode", js: "mode", typ: r("Mode") },
        { json: "geometry", js: "geometry", typ: r("Geometry") },
        { json: "destinations", js: "destinations", typ: u(undefined, "") },
        { json: "ref", js: "ref", typ: u(undefined, "") },
        { json: "exits", js: "exits", typ: u(undefined, "") },
    ], false),
    "Intersection": o([
        { json: "bearings", js: "bearings", typ: a(0) },
        { json: "entry", js: "entry", typ: a(true) },
        { json: "mapbox_streets_v8", js: "mapbox_streets_v8", typ: u(undefined, r("MapboxStreetsV8")) },
        { json: "is_urban", js: "is_urban", typ: u(undefined, true) },
        { json: "admin_index", js: "admin_index", typ: 0 },
        { json: "out", js: "out", typ: u(undefined, 0) },
        { json: "geometry_index", js: "geometry_index", typ: 0 },
        { json: "location", js: "location", typ: a(3.14) },
        { json: "weight", js: "weight", typ: u(undefined, 3.14) },
        { json: "traffic_signal", js: "traffic_signal", typ: u(undefined, true) },
        { json: "turn_duration", js: "turn_duration", typ: u(undefined, 3.14) },
        { json: "turn_weight", js: "turn_weight", typ: u(undefined, 3.14) },
        { json: "duration", js: "duration", typ: u(undefined, 3.14) },
        { json: "in", js: "in", typ: u(undefined, 0) },
        { json: "classes", js: "classes", typ: u(undefined, a(r("Class"))) },
        { json: "lanes", js: "lanes", typ: u(undefined, a(r("Lane"))) },
        { json: "railway_crossing", js: "railway_crossing", typ: u(undefined, true) },
        { json: "stop_sign", js: "stop_sign", typ: u(undefined, true) },
    ], false),
    "Lane": o([
        { json: "indications", js: "indications", typ: a(r("DrivingSide")) },
        { json: "valid", js: "valid", typ: true },
        { json: "active", js: "active", typ: true },
        { json: "valid_indication", js: "valid_indication", typ: u(undefined, r("DrivingSide")) },
    ], false),
    "MapboxStreetsV8": o([
        { json: "class", js: "class", typ: r("Class") },
    ], false),
    "Maneuver": o([
        { json: "type", js: "type", typ: "" },
        { json: "instruction", js: "instruction", typ: "" },
        { json: "bearing_after", js: "bearing_after", typ: 0 },
        { json: "bearing_before", js: "bearing_before", typ: 0 },
        { json: "location", js: "location", typ: a(3.14) },
        { json: "modifier", js: "modifier", typ: u(undefined, r("DrivingSide")) },
    ], false),
    "Waypoint": o([
        { json: "distance", js: "distance", typ: 3.14 },
        { json: "name", js: "name", typ: "" },
        { json: "location", js: "location", typ: a(3.14) },
    ], false),
    "Type": [
        "LineString",
    ],
    "DrivingSide": [
        "left",
        "right",
        "slight left",
        "slight right",
        "straight",
    ],
    "Class": [
        "motorway",
        "motorway_link",
        "secondary",
        "secondary_link",
        "street",
        "tertiary",
        "tertiary_link",
    ],
    "Mode": [
        "driving",
    ],
};
