import {assertChildNode, assertNode, getChild} from './util';

export * from './primitives';
export * from './attr';

type ComposeFunction<T> = (node: ChildNode | undefined) => T | null;

let logger: undefined | Console;
export function setLogger(newLogger: Console) {
	logger = newLogger;
}

export type BaseMapperFunction<T> = (node: ChildNode | undefined) => T | null;

export type ObjectMapperFunction<T> = (node: ChildNode | undefined, rootNode: ChildNode) => T | null;

export type AnyMapperFunction<T> = BaseMapperFunction<T> | ObjectMapperFunction<T>;
/**
 * Base schema item
 */
export type SchemaItem<T> = {
	mapper: AnyMapperFunction<T>;
	required?: true;
	ignoreCase?: true;
	attribute?: true;
	namespace?: string;
};
/**
 * SchemaItem for object mapper
 */
export type ObjectMapperSchemaItem<T> = SchemaItem<T> & {
	mapper: ObjectMapperFunction<T> | BaseMapperFunction<T>;
};

/**
 * SchemaItem for array mapper
 */
export type ArrayMapperSchemaItem<T> = SchemaItem<T> & {
	mapper: BaseMapperFunction<T>;
};

/**
 * Schema for object mapper (with root node access)
 */
export type ObjectMapperSchema<T> = {
	[K in keyof T]: ObjectMapperSchemaItem<T[K]>;
};

/**
 * Schema for array mapper
 */
export type ArrayMapperSchema<T> = {
	[K in keyof T]: ArrayMapperSchemaItem<T[K]>;
};

export function arrayValue<T>(mapper: ComposeFunction<T>) {
	return function (node: ChildNode | undefined): T[] {
		assertNode(node);
		const out: T[] = [];
		for (const child of Array.from(node.childNodes)) {
			const value = mapper(child);
			if (value) {
				out.push(value);
			}
		}
		return out;
	};
}

export function unknownValue(node: ChildNode | undefined): unknown | null {
	assertNode(node);
	if (node.textContent) {
		logger?.warn(node.textContent);
	}
	return null;
}

export function rootParser<T extends Record<string, unknown> = Record<string, unknown>>(rootNode: Element, schema: ObjectMapperSchema<T>): T {
	assertNode(rootNode);
	const childMap = new Map(Array.from(rootNode.childNodes).map<[string, ChildNode]>((child) => [child.nodeName, child]));
	childMap.delete('#text');
	const patchItem = Object.entries(schema).reduce<Record<string, unknown>>((prev, [schemaKey, schemaItem]) => {
		const {key, child} = getChild(childMap, schemaKey, schemaItem);
		let value;
		if (schemaItem.attribute) {
			value = schemaItem.mapper(undefined, rootNode); // we don't allow read attributes from child node when it's object type (no way to map it)
		} else {
			value = child ? schemaItem.mapper(child, rootNode) : null;
		}
		if (schemaItem.required && value === null) {
			throw new Error(`key ${key} is required on schema`);
		}
		prev[schemaKey] = value;
		childMap.delete(key);
		return prev;
	}, {} as T);
	if (childMap.size > 0) {
		throw new Error(`unknown key ${Array.from(childMap.keys()).join(',')}`);
	}
	return patchItem as T;
}

export function objectSchema<T extends Record<string, unknown> = Record<string, unknown>>(schema: ObjectMapperSchema<T>): ComposeFunction<T> {
	return function (rootNode: ChildNode | undefined): T {
		return rootParser(rootNode as Element, schema);
	};
}

function getNsKey(key: string, schemaItem: SchemaItem<unknown>) {
	return schemaItem.namespace ? `${schemaItem.namespace}:${key}` : key;
}

function isValuePresent(child: ChildNode, key: string, schemaItem: SchemaItem<unknown>) {
	const nsKey = getNsKey(key, schemaItem);
	return schemaItem.ignoreCase ? child.nodeName.toLowerCase() === nsKey.toLowerCase() : child.nodeName === nsKey;
}

export function arraySchema<T extends Record<string, unknown> = Record<string, unknown>>(schema: ArrayMapperSchema<T>): ComposeFunction<T[]> {
	return function (rootNode: ChildNode | undefined): T[] {
		assertChildNode(rootNode);
		const out: T[] = [];
		for (const child of Array.from(rootNode.childNodes)) {
			if (child.childNodes === null) continue;
			const patchItem = Object.entries(schema).reduce<Record<string, unknown>>((prev, [key, schemaItem]) => {
				const isPresent = isValuePresent(child, key, schemaItem);
				const value = isPresent || schemaItem.attribute ? schemaItem.mapper(child, rootNode) : null;
				if (schemaItem.required && value === null) {
					throw new Error(`key ${key} is required on schema`);
				}
				prev[key] = value;
				return prev;
			}, {});
			out.push(patchItem as T);
		}
		return out as unknown as T[];
	};
}
