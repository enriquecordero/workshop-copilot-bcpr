import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { NotificationType } from '../../domain/notification-type';

export class CreateNotificationArguments {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;
}
