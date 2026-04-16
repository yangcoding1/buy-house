"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Utility Functions ---
const formatKRW = (val: number) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" })
    .format(val * 10000)
    .replace("₩", "") + "원";

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

export default function RealEstateSimulator() {
  // --- States ---
  const [inputs, setInputs] = useState({
    mySalary: 450,
    wifeSalary: 400,
    aptPrice: 145000, // 만원 단위
    currentCash: 80000,
    mortgageAmount: 60000,
    mortgageRate: 4.2,
    mortgageYears: 30,
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
    const incidentalCost = Math.round(inputs.aptPrice * 0.033);
    const totalRequired = inputs.aptPrice + incidentalCost;

    // 초기 부족분 (신용대출 발생)
    let currentCreditLoan = Math.max(
      0,
      totalRequired - (inputs.currentCash + inputs.mortgageAmount),
    );
    let currentCash = Math.max(
      0,
      inputs.currentCash + inputs.mortgageAmount - totalRequired,
    );
    let currentMortgage = inputs.mortgageAmount;

    const monthlyMortgagePmt = calculateMonthlyPayment(
      inputs.mortgageAmount,
      inputs.mortgageRate,
      inputs.mortgageYears,
    );

    const data = [];
    let month = 0;
    let creditLoanClearedMonth = -1;

    // 시뮬레이션: 신용대출 상환 완료 후 + 12개월까지
    while (true) {
      const netIncome = totalSalary - inputs.livingExpense - monthlyMortgagePmt;

      // 데이터 기록
      data.push({
        name: `${month}개월`,
        cash: Math.round(currentCash),
        creditLoan: Math.round(currentCreditLoan),
        mortgage: Math.round(currentMortgage),
      });

      // 상환 로직
      if (currentCreditLoan > 0) {
        if (netIncome >= currentCreditLoan) {
          const surplus = netIncome - currentCreditLoan;
          currentCreditLoan = 0;
          currentCash += surplus;
          creditLoanClearedMonth = month;
        } else {
          currentCreditLoan -= netIncome;
        }
      } else {
        currentCash += netIncome;
      }

      // 주담대 잔액 감소 (단순화를 위해 원금 균등에 가까운 감액 적용 또는 고정금리 유지)
      // 실제 원리금 균등 상환 시 원금 부분 계산
      const monthlyRate = inputs.mortgageRate / 100 / 12;
      const interestPayment = currentMortgage * monthlyRate;
      const principalPayment = monthlyMortgagePmt - interestPayment;
      currentMortgage = Math.max(0, currentMortgage - principalPayment);

      if (creditLoanClearedMonth !== -1 && month >= creditLoanClearedMonth + 12)
        break;
      if (month > 360) break; // 최대 30년 제한
      month++;
    }
    return { data, incidentalCost, totalRequired, monthlyMortgagePmt };
  }, [inputs]);

  const { data, incidentalCost, totalRequired, monthlyMortgagePmt } =
    simulationData;

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
            <CardHeader>
              <CardTitle className="text-lg">설정 변수</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>나의 월급 (만)</Label>
                  <Input
                    type="number"
                    value={inputs.mySalary}
                    onChange={(e) =>
                      setInputs({ ...inputs, mySalary: +e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>아내 월급 (만)</Label>
                  <Input
                    type="number"
                    value={inputs.wifeSalary}
                    onChange={(e) =>
                      setInputs({ ...inputs, wifeSalary: +e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>아파트 매매가 (만)</Label>
                <Input
                  type="number"
                  value={inputs.aptPrice}
                  onChange={(e) =>
                    setInputs({ ...inputs, aptPrice: +e.target.value })
                  }
                />
                <p className="text-xs text-blue-600">
                  부대비용(3.3%): +{formatKRW(incidentalCost)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>보유 현금 (만)</Label>
                <Input
                  type="number"
                  value={inputs.currentCash}
                  onChange={(e) =>
                    setInputs({ ...inputs, currentCash: +e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>주담대 금액 (만)</Label>
                  <Input
                    type="number"
                    value={inputs.mortgageAmount}
                    onChange={(e) =>
                      setInputs({ ...inputs, mortgageAmount: +e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>금리 (%)</Label>
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
              <div className="space-y-2">
                <Label>긴축 생활비 (만)</Label>
                <Input
                  type="number"
                  value={inputs.livingExpense}
                  onChange={(e) =>
                    setInputs({ ...inputs, livingExpense: +e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Right */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">총 소요 자금</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatKRW(totalRequired)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">초기 신용대출</p>
                  <p className="text-xl font-bold text-red-500">
                    {formatKRW(data[0].creditLoan)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">월 원리금 상환</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatKRW(Math.round(monthlyMortgagePmt))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Area */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">자산 및 대출 추이</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setVisibleKeys((prev) => ({ ...prev, cash: !prev.cash }))
                    }
                    className={`px-3 py-1 text-xs rounded-full border ${visibleKeys.cash ? "bg-emerald-500 text-white" : "bg-white text-slate-400"}`}
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
                    className={`px-3 py-1 text-xs rounded-full border ${visibleKeys.creditLoan ? "bg-orange-500 text-white" : "bg-white text-slate-400"}`}
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
                    className={`px-3 py-1 text-xs rounded-full border ${visibleKeys.mortgage ? "bg-blue-500 text-white" : "bg-white text-slate-400"}`}
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
                    <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(val) => `${val / 10000}억`}
                    />
                    <Tooltip formatter={(value: any) => formatKRW(value)} />
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
          </div>
        </div>

        {/* 상세 표 */}
        <Card className="bg-white border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">
              월별 상세 데이터 (Timeline)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-3">기간</th>
                    <th className="px-6 py-3">보유 현금</th>
                    <th className="px-6 py-3">신용대출 잔액</th>
                    <th className="px-6 py-3">주담대 잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data
                    .filter((_, i) => i % 3 === 0 || i === data.length - 1)
                    .map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">{row.name}</td>
                        <td className="px-6 py-4 text-emerald-600">
                          {formatKRW(row.cash)}
                        </td>
                        <td className="px-6 py-4 text-orange-600">
                          {formatKRW(row.creditLoan)}
                        </td>
                        <td className="px-6 py-4 text-blue-600">
                          {formatKRW(row.mortgage)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
