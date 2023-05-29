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
	isRequired: boolean;
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
	const childMap = new Map(Array.from(rootNode.childNodes).map<[string, ChildNode]>((child) => [child.nodeName, child]));
	childMap.delete('#text');
	const schemaEntries = Object.entries(schema) as [string, XmlSchemaItem<T[keyof T]>][];
	const patchItem = schemaEntries.reduce<Record<string, unknown>>((prev, [schemaKey, schemaItem]) => {
		logger?.debug(`objectSchema key '${schemaKey}' lookup ${buildXmlPath(rootNode)}`);
		const {key, child} = getChild(childMap, schemaKey, schemaItem, opts);
		const value = schemaItem.mapper({isRequired: schemaItem.required || false, lookupKey: key, node: child, opts, rootNode});
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
			isRequired: schemaItem.required || false,
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
	return function ({lookupKey, node, rootNode, opts, isRequired}): T | null {
		if (!node) {
			if (isRequired) {
				throw new XmlParserError(`node for key '${lookupKey}' not found and is required on schema`, rootNode);
			} else {
				return null;
			}
		}
		if (!nodeIsElement(node)) {
			throw new XmlParserError(`node is not an element type`, node);
		}
		logger?.debug(`objectSchema ${buildXmlPath(node)}`);
		return objectParser(node, schema, opts);
	};
}

/**
 * mapping for array of objects based on schema
 */
export function arraySchemaValue<T extends Record<string, unknown> = Record<string, unknown>>(schema: XmlMappingSchema<T>): XmlMappingComposeFunction<T[]> {
	return function ({lookupKey, node, rootNode, opts, isRequired}): T[] | null {
		if (!node) {
			if (isRequired) {
				throw new XmlParserError(`node for key '${lookupKey}' not found and is required on schema`, rootNode);
			}
			if (opts.emptyArrayAsArray) {
				return [];
			}
			return null;
		}
		assertChildNode(node);
		let idx = 0;
		return Array.from(node.childNodes).reduce<T[]>((prev, child) => {
			// skip non-element nodes (text, attributes, comments, etc)
			if (!nodeIsElement(child)) {
				return prev;
			}
			logger?.debug(`arraySchema [${idx}] ${buildXmlPath(child)}`);
			prev.push(objectParser(child, schema, opts));
			idx++;
			return prev;
		}, []);
	};
}

/**
 * mapping for array of objects
 * @param name name of the root of the list
 */
export function directArraySchemaValue<T extends Record<string, unknown> = Record<string, unknown>>(
	name: string,
	schema: XmlMappingSchema<T>,
): XmlMappingComposeFunction<T[]> {
	return function ({node, opts, isRequired}): T[] | null {
		assertChildNode(node);
		const targetNodeName = opts.ignoreCase ? name.toLowerCase() : name;
		// check that the node name matches the expected nodeName from child nodes
		warnChildNodeNames(node, targetNodeName, opts);
		// get parent array node
		const parentArrayNode = Array.from(node.childNodes).find((n) =>
			opts.ignoreCase ? n.nodeName.toLowerCase() === targetNodeName : n.nodeName === targetNodeName,
		);
		if (!parentArrayNode) {
			if (isRequired) {
				throw new XmlParserError(`parent array node for nodeName '${targetNodeName}' not found `, node);
			}
			if (opts.emptyArrayAsArray) {
				return [];
			}
			return null;
		}
		let idx = 0;
		return Array.from(parentArrayNode.childNodes).reduce<T[]>((prev, child) => {
			// skip non-element nodes (text, attributes, comments, etc)
			if (!nodeIsElement(child)) {
				return prev;
			}
			logger?.debug(`directArraySchema [${idx}] ${buildXmlPath(child)}`);
			prev.push(objectParser(child as Element, schema, opts));
			idx++;
			return prev;
		}, []);
	};
}

/**
 * Warn if child nodes are found but nodeName does not match the expected nodeName we are looking for
 */
function warnChildNodeNames(node: Node, targetNodeName: string, opts: XmlParserOptions): void {
	const childNodeNames = new Set(Array.from(node.childNodes).map((n) => (opts.ignoreCase ? n.nodeName.toLowerCase() : n.nodeName)));
	if (childNodeNames.size > 0 && !childNodeNames.has(targetNodeName)) {
		logger?.debug(`no matching ${targetNodeName} found from ${buildXmlPath(node)}`);
	}
}

export function nodeIsElement(node: Node): node is Element {
	return node.nodeType === 1;
}
