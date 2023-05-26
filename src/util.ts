import {SchemaItem} from '.';

export function assertNode(node: ChildNode | undefined): asserts node is ChildNode {
	if (!node) {
		throw TypeError('Node is null');
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

export function getChild<T>(map: Map<string, ChildNode>, key: string, schemaItem: SchemaItem<T>): {child: ChildNode | undefined; key: string} {
	let nsKey = schemaItem.namespace ? `${schemaItem.namespace}:${key}` : key;
	let child: ChildNode | undefined;
	if (schemaItem.ignoreCase) {
		child = map.get(nsKey.toLowerCase());
		if (!child && !schemaItem.attribute) {
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
