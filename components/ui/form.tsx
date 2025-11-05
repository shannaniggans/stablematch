import * as React from 'react';
import { Controller, FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormProps<TFieldValues extends FieldValues = FieldValues>
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<TFieldValues>;
}

export function Form<TFieldValues extends FieldValues>({ form, children, className, ...props }: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form className={cn('space-y-6', className)} {...props}>
        {children}
      </form>
    </FormProvider>
  );
}

export const FormField = Controller;

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-1.5', className)} {...props} />
));
FormItem.displayName = 'FormItem';

export const FormLabel = ({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-medium text-muted-foreground', className)} {...props} />
);

export const FormControl = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-2', className)} {...props} />
);

export const FormDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-muted-foreground', className)} {...props} />
);

export const FormMessage = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  if (!children) return null;
  return (
    <p className={cn('text-xs font-medium text-destructive', className)} {...props}>
      {children}
    </p>
  );
};
