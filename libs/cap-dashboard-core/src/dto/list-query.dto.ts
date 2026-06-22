export class ListQueryDto {
  page?: number;
  limit?: number;
  topic?: string;
  onlyUnpublished?: boolean;
  due?: boolean;
  full?: boolean;
}
