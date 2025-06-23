import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  street: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(8)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  complement?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  number: string;
}
