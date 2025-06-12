"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, SubmitHandler, FieldError, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateAssignmentFormSchema,
  CreateAssignmentFormValues,
  FormValuesForRHF,
  RHFQuestion,
  RHFQuestionOption,
  ModelQuestionType,
  ServerActionResponse,
  FieldErrorsMap
} from "@/lib/actions/assignment.types";
import { createAssignmentAction } from "@/lib/actions/assignment.actions";
import { getAllSubjectsAction, SubjectActionResponse as SubjectSAR } from "@/lib/actions/subject.actions";
import { ISubject } from "@/lib/db/models/subject.model";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PlusCircle, Trash2, XIcon, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const questionTypeOptions: { value: ModelQuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "short_answer", label: "Short Answer" },
  { value: "essay", label: "Essay" },
  { value: "file_upload", label: "File Upload" },
];

const generateNewOption = (): RHFQuestionOption => ({ id: crypto.randomUUID(), text: "", isCorrect: false });
const generateNewQuestion = (): RHFQuestion => ({ id: crypto.randomUUID(), questionText: "", questionType: "short_answer", points: 10, options: undefined });

export default function CreateAssignmentForm() {
  const router = useRouter();
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
  const [formLevelError, setFormLevelError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<RHFQuestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [activeSuggestionQuestionIndex, setActiveSuggestionQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const response: SubjectSAR = await getAllSubjectsAction();
        if (response.success && response.subjects) {
          setSubjects(response.subjects);
        } else {
          toast.error("Failed to load subjects.", { description: response.error || "Unknown error" });
        }
      } catch (e: any) {
        toast.error("Error fetching subjects.", { description: e.message });
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const form = useForm<FormValuesForRHF, any, CreateAssignmentFormValues>({
    resolver: zodResolver(CreateAssignmentFormSchema),
    defaultValues: {
      title: "", description: "", subjectId: "", dueDate: undefined,
      questions: [generateNewQuestion()],
    },
    mode: "onChange",
  });

  const { fields: questionsFromUseFieldArray, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control: form.control, name: "questions", keyName: "fieldId" });
  const addOptionToQuestion = (qIdx: number) => { const p = `questions.${qIdx}.options` as const; form.setValue(p, [...(form.getValues(p) || []), generateNewOption()], { shouldValidate: true }); };
  const removeOptionFromQuestion = (qIdx: number, oIdx: number) => { const p = `questions.${qIdx}.options` as const; form.setValue(p, (form.getValues(p) || []).filter((_, i) => i !== oIdx), { shouldValidate: true }); };
  const handleQuestionTypeChange = (newType: ModelQuestionType, questionPath: `questions.${number}`) => { if (newType === 'multiple_choice') { const co = form.getValues(`${questionPath}.options`); if (!co || co.length === 0) form.setValue(`${questionPath}.options`, [generateNewOption(), generateNewOption()], {shouldValidate:true});} else {form.setValue(`${questionPath}.options`, undefined, {shouldValidate:true});}};
  
  const fetchAISuggestions = async (questionIndex?: number) => {
    setIsFetchingSuggestions(true); setSuggestionError(null); setAiSuggestions([]); setActiveSuggestionQuestionIndex(questionIndex === undefined ? null : questionIndex);
    const assignmentTitle = form.getValues("title"); const assignmentDescription = form.getValues("description");
    let currentQuestionText; let questionType;
    if (typeof questionIndex === 'number') { currentQuestionText = form.getValues(`questions.${questionIndex}.questionText`); questionType = form.getValues(`questions.${questionIndex}.questionType`); }
    try {
      const response = await fetch('/api/ai/suggest-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentTitle, assignmentDescription, currentQuestionText, questionType, numSuggestions: 3 }), });
      const data = await response.json();
      if (!response.ok) { setSuggestionError(data.error || `Server error: ${response.status}`); throw new Error(data.error || `Server responded with ${response.status}`); }
      const formattedSuggestions: RHFQuestion[] = (data.suggestions || []).map((sug: any) => ({ id: crypto.randomUUID(), questionText: sug.questionText || "", questionType: sug.questionType || "short_answer", points: typeof sug.points === 'number' ? sug.points : 10, options: (sug.questionType === 'multiple_choice' && Array.isArray(sug.options)) ? sug.options.map((opt: any) => ({ id: crypto.randomUUID(), text: opt.text || "", isCorrect: opt.isCorrect === true })) : undefined, }));
      setAiSuggestions(formattedSuggestions);
      if (formattedSuggestions.length > 0) setShowSuggestionsModal(true);
      else { toast.info("AI didn't find relevant suggestions.", { description: data.rawAIReponse ? "Check AI logs." : "Try more context."}); if (data.rawAIReponse) console.warn("AI raw response:", data.rawAIReponse); }
    } catch (error: any) { console.error("fetchAISuggestions error:", error); let msg = "Error contacting AI."; if(error.message.includes("JSON")) msg="Invalid AI response."; else if(error.message) msg=error.message; setSuggestionError(msg); toast.error("AI Suggestion Error",{description:msg});
    } finally {setIsFetchingSuggestions(false);}};

  const onValidationErrors = (errors: FieldErrors<FormValuesForRHF>) => {
    console.error("FORM VALIDATION ERRORS (React Hook Form 'errors' object):", errors);
    
    toast.error("Please correct the errors in the form.", {
        description: "Check all fields for highlighted error messages.",
    });
  };

  const onSubmit: SubmitHandler<CreateAssignmentFormValues> = async (data) => {
    if (isSubmittingGlobal) return; setIsSubmittingGlobal(true); setFormLevelError(null);
    const tId = toast.loading("Creating assignment...");
    try {
      const res: ServerActionResponse = await createAssignmentAction(data);
      toast.dismiss(tId);
      if (res.success && res.assignmentId) {
        toast.success(res.message || "Assignment created successfully!"); router.push(`/teacher/assignments/${res.assignmentId}`);
      } else {
        toast.error(res.message || "Failed to create assignment.");
        if(res.formError)setFormLevelError(res.formError);
        if(res.fieldErrors){ const errs = res.fieldErrors as FieldErrorsMap; for(const k in errs){ if(Object.hasOwnProperty.call(errs,k)){const fp=k as any; const mOrO=errs[k];const msg=typeof mOrO==='string'?mOrO:(mOrO as {message?:string})?.message; if(msg)form.setError(fp,{type:"server",message:msg});}}}
      }
    }catch(e:any){toast.dismiss(tId);const em=e.message||"Client-side submission error."; setFormLevelError(em);toast.error("Submission Error",{description:em});console.error("onSubmit catch error:",e);}finally{setIsSubmittingGlobal(false);}};
  
  const getErrorMessage = (e: FieldError | { message?: string } | string | undefined):string|undefined => e?(typeof e==='string'?e:e.message):undefined;
  const submitButtonDisabled = isSubmittingGlobal || !form.formState.isDirty || (form.formState.isSubmitted && !form.formState.isValid);

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit, onValidationErrors)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Assignment Details</CardTitle><CardDescription>Provide main information for the assignment.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" {...form.register("title")} placeholder="e.g., Chapter 1 Quiz" />
              {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{getErrorMessage(form.formState.errors.title)}</p>}
            </div>
            <div>
              <Label htmlFor="subjectId">Subject <span className="text-destructive">*</span></Label>
              <Controller
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingSubjects} >
                    <SelectTrigger id="subjectId" className={cn(form.formState.errors.subjectId && "border-destructive")}>
                      <SelectValue placeholder={isLoadingSubjects ? "Loading subjects..." : "Select a subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSubjects ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : subjects.length === 0 ? (
                        <SelectItem value="no-subjects" disabled>No subjects found. Please create one first.</SelectItem>
                      ) : (
                        subjects.map((subject) => (
                          <SelectItem key={subject._id.toString()} value={subject._id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.subjectId && <p className="text-sm text-destructive mt-1">{getErrorMessage(form.formState.errors.subjectId)}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" {...form.register("description")} placeholder="Provide instructions or context..." rows={4}/>
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{getErrorMessage(form.formState.errors.description)}</p>}
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Controller
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.dueDate && <p className="text-sm text-destructive mt-1">{getErrorMessage(form.formState.errors.dueDate)}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add at least one question to the assignment.</CardDescription>
            </div>
            <Button
                type="button" variant="outline" size="sm"
                onClick={() => fetchAISuggestions()}
                disabled={isFetchingSuggestions && activeSuggestionQuestionIndex === null}
            >
                {isFetchingSuggestions && activeSuggestionQuestionIndex === null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                Suggest Questions
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionsFromUseFieldArray.map((questionItem, questionIndex) => {
              const questionPath = `questions.${questionIndex}` as const;
              const questionTypeWatched = form.watch(`${questionPath}.questionType`);
              const optionsForCurrentQuestion = form.watch(`${questionPath}.options`) || [];
              const questionErrors = form.formState.errors.questions?.[questionIndex];

              return (
              <Card key={questionItem.fieldId} className="p-4 md:p-6 border relative group bg-background/50">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-lg text-primary">Question {questionIndex + 1}</h4>
                  {questionsFromUseFieldArray.length > 1 && ( <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(questionIndex)} className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button> )}
                </div>
                <div className="mb-3 text-right">
                    <Button
                        type="button" variant="link" size="sm" className="p-0 h-auto text-xs"
                        onClick={() => fetchAISuggestions(questionIndex)}
                        disabled={isFetchingSuggestions && activeSuggestionQuestionIndex === questionIndex}
                    >
                        {isFetchingSuggestions && activeSuggestionQuestionIndex === questionIndex ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Sparkles className="mr-1 h-3 w-3" />}
                        AI Suggest Alternatives
                    </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`${questionPath}.questionText`}>Question Text <span className="text-destructive">*</span></Label>
                    <Textarea id={`${questionPath}.questionText`} {...form.register(`${questionPath}.questionText`)} placeholder="Enter the question..." rows={3} />
                    {questionErrors?.questionText && (<p className="text-sm text-destructive mt-1">{getErrorMessage(questionErrors.questionText)}</p>)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${questionPath}.questionType`}>Question Type <span className="text-destructive">*</span></Label>
                      <Controller
                        control={form.control} name={`${questionPath}.questionType`}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => { const newType = value as ModelQuestionType; field.onChange(newType); handleQuestionTypeChange(newType, questionPath);}}
                            defaultValue={field.value}
                          >
                            <SelectTrigger id={`${questionPath}.questionType`}><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>{questionTypeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                          </Select>
                        )}
                      />
                      {questionErrors?.questionType && (<p className="text-sm text-destructive mt-1">{getErrorMessage(questionErrors.questionType)}</p>)}
                    </div>
                    <div>
                      <Label htmlFor={`${questionPath}.points`}>Points</Label>
                      <Input id={`${questionPath}.points`} type="number" min="0" {...form.register(`${questionPath}.points`)} placeholder="e.g., 10"/>
                      {questionErrors?.points && (<p className="text-sm text-destructive mt-1">{getErrorMessage(questionErrors.points)}</p>)}
                    </div>
                  </div>
                  {questionTypeWatched === "multiple_choice" && (
                    <div className="space-y-3 pt-4 border-t mt-4">
                      <Label className="text-md font-medium">Multiple Choice Options <span className="text-destructive">*</span></Label>
                       <Controller name={`${questionPath}.options`} control={form.control}
                        render={() => (
                            <RadioGroup
                                value={optionsForCurrentQuestion.find(opt => opt.isCorrect)?.id}
                                onValueChange={(selectedOptionId) => { const updatedOptions = optionsForCurrentQuestion.map(opt => ({ ...opt, isCorrect: opt.id === selectedOptionId })); form.setValue(`${questionPath}.options`, updatedOptions, { shouldValidate: true }); }}
                                className="space-y-2"
                            >
                                {optionsForCurrentQuestion.map((optionItem, optionIndex) => (
                                <div key={optionItem.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50">
                                    <RadioGroupItem value={optionItem.id} id={`${questionPath}.options.${optionIndex}.isCorrectToggle`} />
                                    <Label htmlFor={`${questionPath}.options.${optionIndex}.isCorrectToggle`} className="flex-grow font-normal cursor-pointer sr-only"> Mark option {optionIndex +1} as correct </Label>
                                    <Input {...form.register(`${questionPath}.options.${optionIndex}.text`)} placeholder={`Option ${optionIndex + 1}`} className="flex-grow"/>
                                    {optionsForCurrentQuestion.length > 2 && (<Button type="button" variant="ghost" size="icon" onClick={() => removeOptionFromQuestion(questionIndex, optionIndex)} className="text-muted-foreground hover:text-destructive h-8 w-8"><XIcon className="h-4 w-4" /></Button>)}
                                </div>
                                ))}
                            </RadioGroup>
                          )}
                      />
                       {optionsForCurrentQuestion.map((_, optionIndex) => { const optionTextError = questionErrors?.options?.[optionIndex]?.text as FieldError | undefined; if (optionTextError) { return <p key={`err-opt-txt-${questionIndex}-${optionIndex}`} className="text-xs text-destructive mt-1 ml-8">{getErrorMessage(optionTextError)}</p>; } return null; })}
                      {questionErrors?.options && typeof (questionErrors.options as FieldError)?.message === 'string' && (<p className="text-sm text-destructive mt-1">{(questionErrors.options as FieldError).message}</p>)}
                      <Button type="button" variant="outline" size="sm" onClick={() => addOptionToQuestion(questionIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Add Option</Button>
                    </div>
                  )}
                </div>
              </Card>
            );
            })}
            <Button type="button" variant="outline" className="w-full border-dashed hover:border-solid" onClick={() => appendQuestion(generateNewQuestion())}><PlusCircle className="mr-2 h-4 w-4" /> Add New Question</Button>
            {form.formState.errors.questions?.root && ( <p className="text-sm text-destructive mt-2">{getErrorMessage(form.formState.errors.questions.root)}</p> )}
            {typeof form.formState.errors.questions?.message === 'string' && ( <p className="text-sm text-destructive mt-2">{form.formState.errors.questions.message}</p> )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmittingGlobal}>Cancel</Button>
          <Button type="submit" disabled={submitButtonDisabled}>
            {isSubmittingGlobal ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Assignment"}
          </Button>
        </div>
        {formLevelError && ( <p className="text-sm text-destructive text-center mt-4 p-3 bg-destructive/10 rounded-md"> {formLevelError} </p> )}
        {form.formState.errors.root?.serverError && ( <p className="text-sm text-destructive text-center mt-4 p-3 bg-destructive/10 rounded-md"> {getErrorMessage(form.formState.errors.root.serverError)} </p> )}
      </form>

      {showSuggestionsModal && (
        <Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
          <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]">
            <DialogHeader><DialogTitle>AI Question Suggestions</DialogTitle><DialogDescription>Review these suggestions. You can use them as is, or they might inspire new ideas.</DialogDescription></DialogHeader>
            {isFetchingSuggestions && (<div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/><p className="ml-3 text-muted-foreground">Fetching...</p></div>)}
            {suggestionError && !isFetchingSuggestions && (<p className="text-sm text-destructive p-3 bg-destructive/10 rounded-md my-4">{suggestionError}</p>)}
            {!isFetchingSuggestions && !suggestionError && aiSuggestions.length === 0 && (<p className="text-sm text-muted-foreground p-4 text-center">No suggestions were generated for this context.</p>)}
            {!isFetchingSuggestions && aiSuggestions.length > 0 && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1 pr-3">
                {aiSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4 hover:shadow-md transition-shadow">
                    <p className="font-semibold text-sm mb-1.5 whitespace-pre-wrap">{suggestion.questionText}</p>
                    <div className="flex items-center justify-between text-xs mb-2"><Badge variant="secondary">{suggestion.questionType.replace("_"," ")}</Badge><span className="text-muted-foreground">Points: {suggestion.points}</span></div>
                    {suggestion.questionType === 'multiple_choice' && suggestion.options && (
                      <div className="mt-1 mb-2 pl-2">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Options:</p>
                        <ul className="space-y-0.5">
                          {suggestion.options.map(opt => ( <li key={opt.id} className={cn("text-xs text-muted-foreground p-1 rounded-sm", opt.isCorrect && "bg-green-100 dark:bg-green-800/30 font-medium text-green-700 dark:text-green-400")}>{opt.text} {opt.isCorrect && <span className="ml-1 text-xs">(Correct)</span>}</li> ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={()=>{ if (activeSuggestionQuestionIndex !== null){ const currentQuestions = form.getValues("questions"); const updatedQuestions = [...currentQuestions]; const newQuestionForForm: RHFQuestion = { id: crypto.randomUUID(), questionText: suggestion.questionText, questionType: suggestion.questionType, points: suggestion.points, options: suggestion.options?.map(o => ({...o, id: crypto.randomUUID()})), }; updatedQuestions[activeSuggestionQuestionIndex] = newQuestionForForm; form.setValue(`questions`, updatedQuestions, { shouldValidate: true, shouldDirty: true }); toast.success(`Question ${activeSuggestionQuestionIndex + 1} updated.`);} else {appendQuestion(suggestion);} setShowSuggestionsModal(false);}}>Use Suggestion</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setShowSuggestionsModal(false)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}