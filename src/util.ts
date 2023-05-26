import {SchemaItem} from '.';

export function assertNode(node: ChildNode | undefined): asserts node is ChildNode {
	if (!node) {
		throw TypeError('Node is null');
	}
}

export function getChild<T>(map: Map<string, ChildNode>, key: string, schemaItem: SchemaItem<T>): {child: ChildNode | undefined; key: string} {
	let child: ChildNode | undefined;
	if (schemaItem.ignoreCase) {
		child = map.get(key.toLowerCase());
		if (!child && !schemaItem.attribute) {
			const foundKey = Array.from(map.keys()).find((k) => k.toLowerCase() === key.toLowerCase());
			if (foundKey) {
				child = map.get(foundKey);
				key = foundKey;
			}
		}
	} else {
		child = map.get(key);
	}
	return {child, key};
}
