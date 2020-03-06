import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: 'contratoMask' })
export class ContratoPipe implements PipeTransform {

    transform(value: string) {  

        if (value) {
            value = value.toString();

            if(!value){
                return "0";
            }

            if(value.length < 8) {
                value = ("00000000" + value).slice(-8)
            }

        }
        return value;
    }
}