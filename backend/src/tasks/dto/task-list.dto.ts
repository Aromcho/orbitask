import { PartialType } from '@nestjs/mapped-types';
import { IsHexColor, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTaskListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  title: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class UpdateTaskListDto extends PartialType(CreateTaskListDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
