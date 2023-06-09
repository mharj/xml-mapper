import {XmlParserError, XmlParserOptions, XmlSchemaItem} from '.';

export function parseInteger(value: string | null): number | null {
	if (value === null) {
		return null;
	}
	if (typeof value !== 'string') {
		throw TypeError(`parseInteger expected string, got ${typeof value}`);
	}
	return parseInt(value, 10);
}

export function parseDate(value: string | null): Date | null {
	if (value === null) {
		return null;
	}
	if (typeof value !== 'string') {
		throw TypeError(`parseDate expected string, got ${typeof value}`);
	}
	return new Date(value);
}

export function assertNode(node: ChildNode | undefined, rootNode: ChildNode, message: string): asserts node is ChildNode {
	if (!node) {
		throw new XmlParserError(message, rootNode);
	}
}

export function assertChildNode(node: ChildNode | undefined): asserts node is ChildNode {
	if (!node) {
		throw TypeError('Node is null');
	}
	if (node.childNodes === null) {
		throw TypeError('Node has no child nodes');
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getKey(key: string, schemaItem: XmlSchemaItem<any>, opts: XmlParserOptions): string {
	const casedKey = opts.ignoreCase ? key.toLowerCase() : key;
	return schemaItem.namespace ? `${schemaItem.namespace}:${casedKey}` : casedKey;
}

export function getChild<T>(
	map: Map<string, ChildNode>,
	key: string,
	schemaItem: XmlSchemaItem<T>,
	opts: XmlParserOptions,
): {child: ChildNode | undefined; key: string} {
	let nsKey = schemaItem.namespace ? `${schemaItem.namespace}:${key}` : key;
	let child: ChildNode | undefined;
	if (opts.ignoreCase) {
		child = map.get(nsKey.toLowerCase());
		if (!child) {
			const foundKey = Array.from(map.keys()).find((k) => k.toLowerCase() === nsKey.toLowerCase());
			if (foundKey) {
				child = map.get(foundKey);
				nsKey = foundKey;
			}
		}
	} else {
		child = map.get(nsKey);
	}
	return {child, key: nsKey};
}

export function buildXmlPath(rootNode: Node): string {
	const path = [rootNode.nodeName];
	let current = rootNode;
	while (current.parentNode) {
		current = current.parentNode;
		path.push(current.nodeName);
	}
	return path.reverse().join('/');
}
