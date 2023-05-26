export function assertNode(node: ChildNode | undefined): asserts node is ChildNode {
	if (!node) {
		throw TypeError('Node is null');
	}
}
