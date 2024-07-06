import { FILE_FORMAT } from "nodes/nodes";

export abstract class Specification<T> {
	and: (specification: Specification<T>) => Specification<T>;
	or: (specification: Specification<T>) => Specification<T>;
	not: (specification: Specification<T>) => Specification<T>;
	isSatisfied: (object: T) => boolean;
}

export abstract class CompositeSpecification<T> implements Specification<T> {
	and(other: Specification<T>): Specification<T> {
		return new AndSpecification<T>(this, other);
	}

	or(other: Specification<T>): Specification<T> {
		return new OrSpecification<T>(this, other);
	}

	not(): Specification<T> {
		return new NotSpecification<T>(this);
	}

	abstract isSatisfied(candidate: T): boolean;
}

class AndSpecification<T> extends CompositeSpecification<T> {
	private left: Specification<T>;
	private right: Specification<T>;

	constructor(left: Specification<T>, right: Specification<T>) {
		super();
		this.left = left;
		this.right = right;
	}

	isSatisfied(candidate: T): boolean {
		return (
			this.left.isSatisfied(candidate) &&
			this.right.isSatisfied(candidate)
		);
	}
}

class OrSpecification<T> extends CompositeSpecification<T> {
	private left: Specification<T>;
	private right: Specification<T>;

	constructor(left: Specification<T>, right: Specification<T>) {
		super();
		this.left = left;
		this.right = right;
	}

	isSatisfied(candidate: T): boolean {
		return (
			this.left.isSatisfied(candidate) ||
			this.right.isSatisfied(candidate)
		);
	}
}

class NotSpecification<T> extends CompositeSpecification<T> {
	private other: Specification<T>;
	constructor(other: Specification<T>) {
		super();
		this.other = other;
	}

	isSatisfied(candidate: T): boolean {
		return !this.other.isSatisfied(candidate);
	}
}

export class ExpressionSpecification<T> extends CompositeSpecification<T> {
	private callback: (candidate: T) => boolean;
	constructor(callback: (candidate: T) => boolean) {
		super();
		this.callback = callback;
	}

	isSatisfied(candidate: T): boolean {
		return this.callback(candidate);
	}
}

export class AudioSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		if (!candidate.type == "file") return false;
		//@ts-ignore
		return candidate.extension in FILE_FORMAT.Audio;
	}
}

export class ImageSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		if (!candidate.type == "file") return false;
		//@ts-ignore
		return candidate.extension in FILE_FORMAT.Image;
	}
}

export class VideoSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		if (!candidate.type == "file") return false;
		//@ts-ignore
		return candidate.extension in FILE_FORMAT.Video;
	}
}

export class DocumentSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		if (!candidate.type == "file") return false;
		//@ts-ignore
		return candidate.extension in FILE_FORMAT.Document;
	}
}

export class FileSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		return candidate.type == "file";
	}
}

export class TextSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		return candidate.type == "text";
	}
}

export class WebSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		return candidate.type == "link";
	}
}

export class GroupSpecification<T> extends CompositeSpecification<T> {
	isSatisfied(candidate: T): boolean {
		//@ts-ignore
		return candidate.type == "group";
	}
}
