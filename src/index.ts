import {assertChildNode, buildXmlPath, getChild, getKey} from './util';
import {XmlParserError} from './XmlParserError';

export * from './primitives';
export * from './rootPrimitives';
export * from './attr';
export * from './XmlParserError';
export * from './util';

export type XmlParserOptions = {
	ignoreCase: boolean;
	emptyArrayAsArray: boolean;
	isStrict: boolean;
	logger: Console | undefined;
};

export type XmlMappingFunctionProps = {
	lookupKey: string;
	node: ChildNode | undefined;
	rootNode: ChildNode;
	opts: XmlParserOptions;
};

export type XmlMappingComposeFunction<T> = (arg: XmlMappingFunctionProps) => T | null;

let logger: undefined | Console;
export function setLogger(newLogger: Console | undefined) {
	logger = newLogger;
}

/**
 * Base schema item
 */
export type XmlSchemaItem<T> = {
	mapper: XmlMappingComposeFunction<T>;
	required?: true;
	namespace?: string;
};

/**
 * Schema for XML object mapping
 */
export type XmlMappingSchema<T> = {
	[K in keyof T]: XmlSchemaItem<T[K]>;
};

function objectParser<T extends Record<string, unknown> = Record<string, unknown>>(rootNode: Element, schema: XmlMappingSchema<T>, opts: XmlParserOptions): T {
	if (!rootNode) {
		throw new XmlParserError('Root node is null', rootNode);
	}
	logger?.debug(`objectSchema ${buildXmlPath(rootNode)}`);
	const childMap = new Map(Array.from(rootNode.childNodes).map<[string, ChildNode]>((child) => [child.nodeName, child]));
	childMap.delete('#text');
	const schemaEntries = Object.entries(schema) as [string, XmlSchemaItem<T[keyof T]>][];
	const patchItem = schemaEntries.reduce<Record<string, unknown>>((prev, [schemaKey, schemaItem]) => {
		logger?.debug(`objectSchema lookup ${buildXmlPath(rootNode)}/${schemaKey}`);
		const {key, child} = getChild(childMap, schemaKey, schemaItem, opts);
		const value = schemaItem.mapper({lookupKey: key, node: child, opts, rootNode});
		if (schemaItem.required && value === null) {
			throw new XmlParserError(`key '${key}' not found on path '${buildXmlPath(rootNode)}' and is required on schema`, rootNode);
		}
		prev[schemaKey] = value;
		childMap.delete(key);
		return prev;
	}, {} as T);
	if (childMap.size > 0) {
		if (opts?.isStrict) {
			throw new XmlParserError(`unknown key(s) '${Array.from(childMap.keys()).join(',')}' in ${buildXmlPath(rootNode)}`, rootNode);
		} else {
			logger?.warn(`XML parser, unknown key(s) '${Array.from(childMap.keys()).join(',')}' in ${buildXmlPath(rootNode)}`);
			logger?.debug('Node', `${rootNode}`);
		}
	}
	return patchItem as T;
}

const initialOptions: XmlParserOptions = {
	emptyArrayAsArray: false,
	ignoreCase: false,
	isStrict: false,
	logger,
};

/**
 * root parser
 */
export function rootParser<T extends Record<string, unknown> = Record<string, unknown>>(
	rootNode: Element,
	schema: XmlMappingSchema<T>,
	opts: Partial<XmlParserOptions> = initialOptions,
): T {
	if (!rootNode) {
		throw new XmlParserError('Root node is null', rootNode);
	}
	const schemaEntries = Object.entries(schema) as [string, XmlSchemaItem<T[keyof T]>][];
	const patchItem = schemaEntries.reduce<Record<string, unknown>>((prev, [schemaKey, schemaItem]) => {
		const currentOpts = Object.assign({}, initialOptions, opts);
		logger?.debug(`rootParser lookup ${buildXmlPath(rootNode)} @ ${schemaKey}`);
		const key = getKey(schemaKey, schemaItem, currentOpts);
		const value = schemaItem.mapper({
			lookupKey: key,
			node: rootNode,
			opts: currentOpts,
			rootNode,
		});
		if (schemaItem.required && value === null) {
			throw new XmlParserError(`key '${key}' not found on path '${buildXmlPath(rootNode)}' and is required on schema`, rootNode);
		}
		prev[schemaKey] = value;
		return prev;
	}, {});
	return patchItem as T;
}

/**
 * mapping for object based on schema
 */
export function objectSchemaValue<T extends Record<string, unknown> = Record<string, unknown>>(schema: XmlMappingSchema<T>): XmlMappingComposeFunction<T> {
	return function ({lookupKey, node, opts}): T | null {
		if (!schema[lookupKey]?.required && !node) {
			return null; // if not required and not found, return null wihout parsing
		}
		return objectParser(node as Element, schema, opts);
	};
}

/**
 * mapping for array of objects based on schema
 */
export function arraySchemaValue<T extends Record<string, unknown> = Record<string, unknown>>(schema: XmlMappingSchema<T>): XmlMappingComposeFunction<T[]> {
	return function ({lookupKey, node, opts}): T[] | null {
		if (!schema[lookupKey]?.required && !node) {
			if (opts.emptyArrayAsArray) {
				return [];
			}
			return null;
		}
		assertChildNode(node);
		return Array.from(node.childNodes).reduce<T[]>((prev, child) => {
			if (child.childNodes === null) return prev;
			prev.push(objectParser(child as Element, schema, opts));
			return prev;
		}, []);
	};
}
