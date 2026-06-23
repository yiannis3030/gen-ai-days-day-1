import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  readonly authors!: string[];

  @IsString()
  @IsNotEmpty()
  readonly isbn!: string;

  @IsInt()
  readonly publishedYear!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly genre?: string;
}
