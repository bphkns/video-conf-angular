import { ClrDatagridStringFilterInterface } from '@clr/angular';

export class EmailFilter implements ClrDatagridStringFilterInterface<any> {
    accepts(user: any, search: string): boolean {
        return (user.email as string).toLowerCase().includes(search.toLowerCase());
    }
}
