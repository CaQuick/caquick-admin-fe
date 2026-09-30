import { useQueryClient } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';

import {
  RegionPicker,
  allRegionsQueryOptions,
  geocodeAddress,
  matchRegionBySigunguCode,
} from '@/features/regions';
import { parseCoordPair, toCoordString } from '@/shared/lib/coords';
import { type PostcodeResult } from '@/shared/lib/kakao-postcode';
import { cn } from '@/shared/lib/utils';
import { AddressSearchDialog } from '@/shared/ui/address-search-dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { NaverMap } from '@/shared/ui/naver-map';

import {
  MAP_PROVIDER_OPTIONS,
  type StoreLocationValues,
  addressFromPostcode,
  mapProviderWarning,
} from '../location-schema';

interface Props<T extends StoreLocationValues> {
  form: UseFormReturn<T>;
  /** 칸 id 앞부분. 한 화면에 폼이 둘이어도 라벨이 섞이지 않게 한다 */
  idPrefix: string;
}

type Geocode = 'idle' | 'loading' | 'done' | 'not-found' | 'failed';

const GEOCODE_MESSAGE: Record<Exclude<Geocode, 'idle'>, string> = {
  loading: '주소로 좌표를 찾고 있습니다.',
  done: '주소로 좌표를 채웠습니다. 지도에서 핀 위치를 확인해 주세요.',
  'not-found': '이 주소의 좌표를 찾지 못했습니다. 지도를 누르거나 좌표를 직접 입력해 주세요.',
  failed: '좌표를 자동으로 채우지 못했습니다. 지도를 누르거나 좌표를 직접 입력해 주세요.',
};
const NOT_SERVICE_AREA = '서비스 지역이 아닙니다. 지역을 직접 선택해 주세요.';

const DETAIL_FIELDS = [
  { name: 'addressCity', label: '시/도' },
  { name: 'addressDistrict', label: '시/군/구' },
  { name: 'addressNeighborhood', label: '동/읍/면' },
] as const;

/**
 * 매장 주소·지역·좌표·지도 제공자 입력(매장 수정과 판매자 등록이 같이 쓴다).
 * 주소 검색 → 시·도/시·군·구/동 채움 → 시군구 코드로 지역 선택 → BE 지오코딩으로 좌표 채움. 좌표 칸은 '직접 수정'에 접어 둔다.
 */
export function StoreLocationFields<T extends StoreLocationValues>({ form, idPrefix }: Props<T>) {
  // 두 폼의 값 타입이 달라도 이 칸들의 이름·모양은 같다
  const f = form as unknown as UseFormReturn<StoreLocationValues>;
  const qc = useQueryClient();
  const { errors } = f.formState;
  const [latitude, longitude, provider, addressFull] = useWatch({
    control: f.control,
    name: ['latitude', 'longitude', 'mapProvider', 'addressFull'],
  });
  const [autoFilled, setAutoFilled] = useState(false);
  const [regionNote, setRegionNote] = useState<string | null>(null);
  const [geocode, setGeocode] = useState<Geocode>('idle');
  const [coordsOpen, setCoordsOpen] = useState(false);
  // 주소를 연달아 고르면 앞선 지오코딩 응답은 버린다
  const request = useRef(0);

  const id = (name: keyof StoreLocationValues) => `${idPrefix}-${name}`;
  const set = (name: keyof StoreLocationValues, value: string) =>
    f.setValue(name, value, { shouldDirty: true, shouldValidate: true });

  const onAddress = async (r: PostcodeResult) => {
    const address = addressFromPostcode(r);
    set('addressFull', address.addressFull);
    set('addressCity', address.addressCity);
    set('addressDistrict', address.addressDistrict);
    set('addressNeighborhood', address.addressNeighborhood);
    setAutoFilled(true);

    const ticket = ++request.current;
    const regions = await qc.fetchQuery(allRegionsQueryOptions()).catch(() => []);
    if (ticket !== request.current) return;
    const matched = matchRegionBySigunguCode(regions, r.sigunguCode);
    set('regionId', matched?.id ?? '');
    setRegionNote(matched ? null : NOT_SERVICE_AREA);

    setGeocode('loading');
    try {
      const result = await geocodeAddress(qc, address.addressFull);
      if (ticket !== request.current) return;
      if (!result) {
        setGeocode('not-found');
        setCoordsOpen(true);
        return;
      }
      set('latitude', toCoordString(result.latitude));
      set('longitude', toCoordString(result.longitude));
      // 우편번호 결과에 시군구 코드가 없을 때 BE가 찾은 지역으로 보완한다
      if (!matched && result.regionId) {
        set('regionId', result.regionId);
        setRegionNote(null);
      }
      setGeocode('done');
    } catch {
      if (ticket !== request.current) return;
      setGeocode('failed');
      setCoordsOpen(true);
    }
  };

  const position = parseCoordPair(latitude, longitude);
  // 빈 새 폼에서는 경고하지 않는다. 주소를 넣은 뒤부터 확인한다
  const warning =
    addressFull.trim() || position ? mapProviderWarning(latitude, longitude, provider) : null;
  // 숨긴 칸에 오류가 있으면 저장이 막힌 이유가 보이지 않는다. 한 번 펼치면 고치는 동안 닫지 않는다
  if ((errors.latitude || errors.longitude) && !coordsOpen) setCoordsOpen(true);
  const showCoords = coordsOpen;

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">주소와 지역</legend>
        <Field
          id={id('addressFull')}
          label="주소"
          required
          error={errors.addressFull?.message}
          help="주소 검색으로 고르면 시·도, 시·군·구, 동과 지역, 좌표를 함께 채웁니다. 층·호수 같은 상세 주소는 이어서 입력해 주세요."
        >
          <div className="flex gap-2">
            <Input
              id={id('addressFull')}
              autoComplete="off"
              className="flex-1"
              aria-invalid={!!errors.addressFull}
              {...f.register('addressFull')}
            />
            <AddressSearchDialog
              initialQuery={addressFull.trim() || undefined}
              onSelect={(r) => void onAddress(r)}
              trigger={
                <Button type="button" variant="outline">
                  <SearchIcon /> 주소 검색
                </Button>
              }
            />
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          {DETAIL_FIELDS.map((d) => (
            <Field key={d.name} id={id(d.name)} label={d.label} error={errors[d.name]?.message}>
              <Input
                id={id(d.name)}
                autoComplete="off"
                readOnly={autoFilled}
                className={cn(autoFilled && 'bg-surface-tint')}
                aria-invalid={!!errors[d.name]}
                {...f.register(d.name)}
              />
            </Field>
          ))}
        </div>
        {autoFilled && (
          <p className="-mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            시·도, 시·군·구, 동은 주소 검색 결과로 채웠습니다.
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto px-0"
              onClick={() => setAutoFilled(false)}
            >
              직접 입력
            </Button>
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">지역</span>
          <Controller
            control={f.control}
            name="regionId"
            render={({ field }) => (
              <RegionPicker
                id={id('regionId')}
                activeOnly
                value={field.value === '' ? undefined : field.value}
                invalid={!!errors.regionId}
                onChange={(v) => {
                  field.onChange(v ?? '');
                  setRegionNote(null);
                }}
              />
            )}
          />
          {regionNote ? (
            <p role="status" className="text-xs text-caution-foreground">
              {regionNote}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              구매자 앱의 지역 필터에 쓰입니다. 주소를 검색하면 자동으로 고릅니다.
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">위치와 지도</legend>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="tabular-nums">
            {position ? `위도 ${latitude.trim()} · 경도 ${longitude.trim()}` : '좌표가 없습니다.'}
          </span>
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto px-0"
            aria-expanded={showCoords}
            aria-controls={`${idPrefix}-coords`}
            onClick={() => setCoordsOpen((o) => !o)}
          >
            {showCoords ? '직접 수정 닫기' : '직접 수정'}
          </Button>
        </div>
        {geocode !== 'idle' && (
          <p
            role="status"
            className={cn(
              'text-xs',
              geocode === 'failed' || geocode === 'not-found'
                ? 'text-caution-foreground'
                : 'text-muted-foreground',
            )}
          >
            {GEOCODE_MESSAGE[geocode]}
          </p>
        )}
        {showCoords && (
          <div id={`${idPrefix}-coords`} className="grid grid-cols-2 gap-3">
            <Field id={id('latitude')} label="위도" error={errors.latitude?.message}>
              <Input
                id={id('latitude')}
                inputMode="decimal"
                autoComplete="off"
                placeholder="37.5665"
                aria-invalid={!!errors.latitude}
                {...f.register('latitude')}
              />
            </Field>
            <Field id={id('longitude')} label="경도" error={errors.longitude?.message}>
              <Input
                id={id('longitude')}
                inputMode="decimal"
                autoComplete="off"
                placeholder="126.9780"
                aria-invalid={!!errors.longitude}
                {...f.register('longitude')}
              />
            </Field>
          </div>
        )}
        <NaverMap
          label="매장 위치 지도"
          position={position}
          onMove={(lat, lng) => {
            set('latitude', lat);
            set('longitude', lng);
          }}
        />
        {provider !== 'NAVER' && (
          <p className="text-xs text-muted-foreground">
            위치 확인용 미리보기입니다. 지도 제공자가 네이버 지도가 아니라 구매자 앱에는 지도가
            나오지 않습니다.
          </p>
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">지도 제공자</legend>
          {MAP_PROVIDER_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 has-checked:border-primary has-checked:bg-primary-soft"
            >
              <input
                type="radio"
                value={o.value}
                className="mt-1 accent-primary"
                {...f.register('mapProvider')}
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{o.label}</span>
                <span className="text-xs text-muted-foreground">{o.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {warning && (
          <p
            role="status"
            className="rounded-md bg-caution-soft px-3 py-2 text-xs text-caution-foreground"
          >
            {warning}
          </p>
        )}
      </fieldset>
    </div>
  );
}

function Field({
  id,
  label,
  required = false,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-negative-foreground"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-negative-foreground">{error}</p>
      ) : help ? (
        <p className="text-xs text-muted-foreground">{help}</p>
      ) : null}
    </div>
  );
}
