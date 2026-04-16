"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Utility Functions ---
const formatKRW = (val: number) => {
  if (isNaN(val)) return "0원";
  return (
    new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" })
      .format(val * 10000)
      .replace("₩", "") + "원"
  );
};

const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  years: number,
) => {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  if (monthlyRate === 0) return principal / numberOfPayments;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
};

function SimulatorContent() {
  const searchParams = useSearchParams();
  const initialCash = Number(searchParams.get("cash")) || 80000;
  const initialYears = Number(searchParams.get("years")) || 30;

  // --- States ---
  const [inputs, setInputs] = useState({
    mySalary: 450,
    wifeSalary: 400,
    aptPrice: 145000, // 만원 단위
    currentCash: initialCash,
    mortgageAmount: 60000,
    mortgageRate: 5.0, // 주담대 디폴트 5%
    mortgageYears: initialYears,
    creditLoanRate: 5.5, // 신용대출 금리 신설
    monthsUntilPurchase: 10, // 잔금일(매매 실행)까지 남은 개월 수
    livingExpense: 250,
  });

  const [visibleKeys, setVisibleKeys] = useState({
    cash: true,
    creditLoan: true,
    mortgage: false,
  });

  // --- Logic ---
  const simulationData = useMemo(() => {
    const totalSalary = inputs.mySalary + inputs.wifeSalary;
    const netIncomeBeforePurchase = totalSalary - inputs.livingExpense;

    // 대한민국 부동산 부대비용 상세 계산 (2026년 기준 추정)
    // 1. 취득세 (+지방교육세 등): 9억 초과 시 3.3% 상정
    let taxRate = 0.011;
    if (inputs.aptPrice > 60000 && inputs.aptPrice <= 90000) taxRate = 0.022;
    if (inputs.aptPrice > 90000) taxRate = 0.033;
    const acquisitionTax = inputs.aptPrice * taxRate;

    // 2. 중개보수: 12~15억 구간 0.6% + 부가세 10%
    let brokerRate = 0.005;
    if (inputs.aptPrice >= 120000 && inputs.aptPrice < 150000)
      brokerRate = 0.006;
    if (inputs.aptPrice >= 150000) brokerRate = 0.007;
    const brokerFee = inputs.aptPrice * brokerRate * 1.1;

    // 3. 법무사 비용 및 채권 할인 등 (보수적으로 매매가의 약 0.2% 산정)
    const legalAndBondFee = inputs.aptPrice * 0.002;

    const incidentalCost = acquisitionTax + brokerFee + legalAndBondFee;
    const totalRequired = inputs.aptPrice + incidentalCost;

    const monthlyMortgagePmt = calculateMonthlyPayment(
      inputs.mortgageAmount,
      inputs.mortgageRate,
      inputs.mortgageYears,
    );

    const data = [];
    let currentCash = inputs.currentCash;
    let currentCreditLoan = 0;
    let currentMortgage = 0;

    let month = 0;
    let creditLoanClearedMonth = -1;

    // 시뮬레이션: 현재(0개월)부터 시작
    while (true) {
      // 매수 시점(잔금일) 이벤트
      if (month === inputs.monthsUntilPurchase) {
        const requiredCash = totalRequired - inputs.mortgageAmount;
        if (currentCash >= requiredCash) {
          currentCash -= requiredCash;
        } else {
          currentCreditLoan = requiredCash - currentCash;
          currentCash = 0;
        }
        currentMortgage = inputs.mortgageAmount;
      }

      data.push({
        name: `${month}개월`,
        cash: Math.round(currentCash),
        creditLoan: Math.round(currentCreditLoan),
        mortgage: Math.round(currentMortgage),
        isPurchaseMonth: month === inputs.monthsUntilPurchase,
      });

      // 매수 전 (저축기)
      if (month < inputs.monthsUntilPurchase) {
        currentCash += netIncomeBeforePurchase;
      }
      // 매수 후 (상환기)
      else {
        const netIncome =
          totalSalary - inputs.livingExpense - monthlyMortgagePmt;

        if (currentCreditLoan > 0) {
          // 신용대출 금리 반영 로직
          const monthlyCreditInterest =
            currentCreditLoan * (inputs.creditLoanRate / 100 / 12);
          const requiredToClear = currentCreditLoan + monthlyCreditInterest;

          if (netIncome >= requiredToClear) {
            const surplus = netIncome - requiredToClear;
            currentCreditLoan = 0;
            currentCash += surplus;
            creditLoanClearedMonth = month;
          } else {
            currentCreditLoan =
              currentCreditLoan + monthlyCreditInterest - netIncome;
          }
        } else {
          currentCash += netIncome; // 신용대출 완납 후엔 순소득 모두 현금 적립
        }

        if (currentMortgage > 0) {
          const monthlyMortgageRate = inputs.mortgageRate / 100 / 12;
          const interestPayment = currentMortgage * monthlyMortgageRate;
          const principalPayment = monthlyMortgagePmt - interestPayment;
          currentMortgage = Math.max(0, currentMortgage - principalPayment);
        }
      }

      // 종료 조건: 매수 이후이고 신용대출 상환 후 12개월이 지났거나, 총 360개월 초과 시
      if (
        month > inputs.monthsUntilPurchase &&
        creditLoanClearedMonth !== -1 &&
        month >= creditLoanClearedMonth + 12
      )
        break;
      if (month > 360) break;
      month++;
    }

    const accumulatedSavings =
      netIncomeBeforePurchase * inputs.monthsUntilPurchase;
    const totalCashAtPurchase = inputs.currentCash + accumulatedSavings;

    return {
      data,
      incidentalCost,
      totalRequired,
      monthlyMortgagePmt,
      totalCashAtPurchase,
      accumulatedSavings,
      acquisitionTax,
      brokerFee,
      legalAndBondFee,
    };
  }, [inputs]);

  const {
    data,
    incidentalCost,
    totalRequired,
    monthlyMortgagePmt,
    totalCashAtPurchase,
    accumulatedSavings,
    acquisitionTax,
    brokerFee,
    legalAndBondFee,
  } = simulationData;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            신혼부부 내 집 마련 재무 시뮬레이터
          </h1>
          <p className="text-slate-500">
            수지/분당 지역 매수 기반 실시간 상환 추이 분석
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1 bg-white border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">설정 변수</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    나의 월급 (만)
                  </Label>
                  <Input
                    type="number"
                    value={inputs.mySalary}
                    onChange={(e) =>
                      setInputs({ ...inputs, mySalary: +e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    아내 월급 (만)
                  </Label>
                  <Input
                    type="number"
                    value={inputs.wifeSalary}
                    onChange={(e) =>
                      setInputs({ ...inputs, wifeSalary: +e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-emerald-600">
                    현재 현금 (만)
                  </Label>
                  <Input
                    type="number"
                    className="border-emerald-200 bg-emerald-50"
                    value={inputs.currentCash}
                    onChange={(e) =>
                      setInputs({ ...inputs, currentCash: +e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    긴축 생활비 (만)
                  </Label>
                  <Input
                    type="number"
                    value={inputs.livingExpense}
                    onChange={(e) =>
                      setInputs({ ...inputs, livingExpense: +e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-blue-600">
                    잔금까지 남은 달
                  </Label>
                  <Input
                    type="number"
                    className="border-blue-200 bg-blue-50"
                    value={inputs.monthsUntilPurchase}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        monthsUntilPurchase: +e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p className="text-slate-600">
                  현재 현금: {formatKRW(inputs.currentCash)}
                </p>
                <p className="text-blue-600 font-medium">
                  잔금일 추가 저축액: +{formatKRW(accumulatedSavings)}
                </p>
                <p className="font-bold border-t mt-1 pt-1">
                  잔금일 총 가용 현금: {formatKRW(totalCashAtPurchase)}
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center">
                  <Label className="text-xs text-slate-500">
                    아파트 매매가 (만)
                  </Label>
                </div>
                <Input
                  type="number"
                  value={inputs.aptPrice}
                  onChange={(e) =>
                    setInputs({ ...inputs, aptPrice: +e.target.value })
                  }
                />

                {/* 툴팁이 적용된 부대비용 영역 */}
                <div className="relative group flex items-center text-xs text-slate-500 mt-1 cursor-help w-max">
                  <span className="border-b border-dashed border-slate-400">
                    부대비용 자동계산: +{formatKRW(incidentalCost)}
                  </span>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50">
                    <p className="font-bold mb-2 pb-1 border-b border-slate-600">
                      부대비용 상세 내역 (추정)
                    </p>
                    <div className="space-y-1">
                      <p className="flex justify-between">
                        <span>취득세 등 (약 3.3%)</span>
                        <span>{formatKRW(acquisitionTax)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>중개보수 (+VAT)</span>
                        <span>{formatKRW(brokerFee)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>법무/채권할인 (약 0.2%)</span>
                        <span>{formatKRW(legalAndBondFee)}</span>
                      </p>
                    </div>
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    주담대 금액 (만)
                  </Label>
                  <Input
                    type="number"
                    value={inputs.mortgageAmount}
                    onChange={(e) =>
                      setInputs({ ...inputs, mortgageAmount: +e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    주담대 금리 (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.mortgageRate}
                    onChange={(e) =>
                      setInputs({ ...inputs, mortgageRate: +e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    신용대출 금리 (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.creditLoanRate}
                    onChange={(e) =>
                      setInputs({ ...inputs, creditLoanRate: +e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    대출 기간 (년)
                  </Label>
                  <Input
                    type="number"
                    value={inputs.mortgageYears}
                    onChange={(e) =>
                      setInputs({ ...inputs, mortgageYears: +e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Right */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">매수 총 소요 자금</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatKRW(totalRequired)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">
                    잔금일 신용대출 부족분
                  </p>
                  <p className="text-xl font-bold text-red-500">
                    {formatKRW(data[0].creditLoan)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">
                    주담대 월 원리금 상환
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatKRW(Math.round(monthlyMortgagePmt))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Area */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  잔금일 이후 자산/대출 추이
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setVisibleKeys((prev) => ({ ...prev, cash: !prev.cash }))
                    }
                    className={`px-3 py-1 text-xs rounded-full border ${visibleKeys.cash ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white text-slate-400"}`}
                  >
                    현금
                  </button>
                  <button
                    onClick={() =>
                      setVisibleKeys((prev) => ({
                        ...prev,
                        creditLoan: !prev.creditLoan,
                      }))
                    }
                    className={`px-3 py-1 text-xs rounded-full border ${visibleKeys.creditLoan ? "bg-orange-500 border-orange-500 text-white" : "bg-white text-slate-400"}`}
                  >
                    신용대출
                  </button>
                  <button
                    onClick={() =>
                      setVisibleKeys((prev) => ({
                        ...prev,
                        mortgage: !prev.mortgage,
                      }))
                    }
                    className={`px-3 py-1 text-xs rounded-full border ${visibleKeys.mortgage ? "bg-blue-500 border-blue-500 text-white" : "bg-white text-slate-400"}`}
                  >
                    주담대
                  </button>
                </div>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorCash"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorCredit"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorMort"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <ReferenceLine
                      x={`${inputs.monthsUntilPurchase}개월`}
                      stroke="#f43f5e"
                      strokeDasharray="5 5"
                      label={{
                        position: "top",
                        value: "매수일",
                        fill: "#f43f5e",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                    <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(val) => `${val / 10000}억`}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatKRW(Number(value))}
                    />
                    {visibleKeys.cash && (
                      <Area
                        type="monotone"
                        dataKey="cash"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorCash)"
                        name="현금"
                      />
                    )}
                    {visibleKeys.creditLoan && (
                      <Area
                        type="monotone"
                        dataKey="creditLoan"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorCredit)"
                        name="신용대출"
                      />
                    )}
                    {visibleKeys.mortgage && (
                      <Area
                        type="monotone"
                        dataKey="mortgage"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorMort)"
                        name="주담대 잔액"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tracking Table Area */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">월별 상세 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto h-[400px] overflow-y-auto relative rounded-md border">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3">월</th>
                        <th className="px-4 py-3 text-right">현금</th>
                        <th className="px-4 py-3 text-right">신용대출</th>
                        <th className="px-4 py-3 text-right">주담대</th>
                        <th className="px-4 py-3 text-center">이벤트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(
                        (
                          row: {
                            name: string;
                            cash: number;
                            creditLoan: number;
                            mortgage: number;
                            isPurchaseMonth: boolean;
                          },
                          i: number,
                        ) => (
                          <tr
                            key={i}
                            className={`border-b hover:bg-slate-50 ${row.isPurchaseMonth ? "bg-rose-50" : ""}`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {row.name} {i === 0 && "(현재)"}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                              {formatKRW(row.cash)}
                            </td>
                            <td className="px-4 py-3 text-right text-orange-500 font-medium">
                              {formatKRW(row.creditLoan)}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600 font-medium">
                              {formatKRW(row.mortgage)}
                            </td>
                            <td className="px-4 py-3 text-center text-xs">
                              {row.isPurchaseMonth && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold">
                                  매매/잔금
                                </span>
                              )}
                              {i > 0 &&
                                row.creditLoan === 0 &&
                                data[i - 1].creditLoan > 0 && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                                    신용대출 완납
                                  </span>
                                )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RealEstateSimulator() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-none shadow-sm p-8 text-center">
            <p className="text-slate-500 font-medium">
              데이터를 불러오는 중입니다...
            </p>
          </Card>
        </div>
      }
    >
      <SimulatorContent />
    </Suspense>
  );
}
