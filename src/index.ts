import {assertNode} from './util';

export * from './primitives';
export * from './attr';

type ComposeFunction<T> = (node: ChildNode | undefined) => T | null;

let logger: undefined | Console;
export function setLogger(newLogger: Console) {
	logger = newLogger;
}

export type BaseMapperFunction<T> = (node: ChildNode | undefined) => T | null;

export type ObjectMapperFunction<T> = (node: ChildNode | undefined, rootNode: ChildNode) => T | null;

/**
 * Schema for object mapper (with root node access)
 */
export type ObjectMapperSchema<T> = {
	[K in keyof T]: {
		mapper: ObjectMapperFunction<T[K]> | BaseMapperFunction<T[K]>;
		required?: true;
		attribute?: true;
	};
};

/**
 * Schema for array mapper
 */
export type ArrayMapperSchema<T> = {
	[K in keyof T]: {
		mapper: BaseMapperFunction<T[K]>;
		required?: true;
		attribute?: true;
	};
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
	const patchItem = Object.entries(schema).reduce<Record<string, unknown>>((prev, [key, schemaItem]) => {
		const child = childMap.get(key);
		let value;
		if (schemaItem.attribute) {
			value = schemaItem.mapper(undefined, rootNode); // we don't allow read attributes from child node when it's object type (no way to map it)
		} else {
			value = child ? schemaItem.mapper(child, rootNode) : null;
		}
		if (schemaItem.required && value === null) {
			throw new Error(`key ${key} is required on schema`);
		}
		prev[key] = value;
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

export function arraySchema<T extends Record<string, unknown> = Record<string, unknown>>(schema: ArrayMapperSchema<T>): ComposeFunction<T[]> {
	return function (rootNode: ChildNode | undefined): T[] {
		assertNode(rootNode);
		if (rootNode.childNodes === null) {
			throw new Error('rootNode.childNodes is null');
		}
		const out: T[] = [];
		for (const child of Array.from(rootNode.childNodes)) {
			if (child.childNodes === null) continue;
			const patchItem = Object.entries(schema).reduce<Record<string, unknown>>((prev, [key, schemaItem]) => {
				const value = child.nodeName === key || schemaItem.attribute ? schemaItem.mapper(child, rootNode) : null;
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
